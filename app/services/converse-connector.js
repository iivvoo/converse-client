import Ember from 'ember';
import { storageFor } from 'ember-local-storage';

/*
 * It's not about events, it's about activities. You want them grouped.
 * If a user joins, talks, leaves, you don't want three separate
 * events. So join/part are grouped just like messages are.
 *
 * If multiple join/leave activities (without further activity) are present
 * group them in stead. E.g.
 * [img] iivvoo joines. also, Foo, Bar and bla joined.
 * Possibly when too many stuff happens, "Lot's of people joined/left"
 * ( and allow it to expand)
 */

var Group = Ember.Object.extend({
    name: '',
    firstChannelLoaded: false,

    init() {
        console.log("Group init", this.name);
        this.set('channels_map', Ember.Object.create());
        this.set('channels', Ember.A());
        this.set('users_map', Ember.Object.create());
        this.set('users', Ember.A());
    },

    ordered_channels: function() {
        let r = Ember.A();

        for(let c of this.get("channels")) {
            r.pushObject(this.get(`channels_map.${c}`));
        }
        return r;

    }.property("channels.[]"),

    handleEvent(event) {
        console.log(event);
        let eventtype = event.type;
        let channel = event.channel;
        let channelid = event.channelid;
        let when = new Date(event.when);

        let channels = this.get("channels");
        let channels_map = this.get('channels_map');
        let users = this.get("users");


        if(eventtype === "CREATE_CHANNEL") {
            // channel is an object {id, name}
            if(!channels.contains(channel.id)) {
                channels.pushObject(channel.id);
                let newchannel = Channel.create({id: channel.id, name: channel.name});
                channels_map.set(channel.id.toString(), newchannel);
                console.log(`Channel entry created for ${channel.id}/${channel.name}`);
                this.set('firstChannelLoaded', true);
            }
        }
        else if(eventtype === 'USERJOIN') {
            let chan = channels_map.get(channelid.toString());
            let user = this.addUser(event.user);
            chan.userJoin(user, when);
        }
        else if(eventtype === 'USERPART') {
            let chan = channels_map.get(channelid.toString());
            let user = this.getUser(event.userid);
            chan.userJoin(user, when);
        }
        else if(eventtype === "NICKCHANGE") {
            let chan = channels_map.get(channelid.toString());
            let user = this.getUser(event.userid);
            let oldnick = user.name;
            chan.userNickChange(user, oldnick, when);

            user.set('name', event.nickname);
        }
        else if(eventtype === "CHANNEL_MESSAGE") {
            let chan = channels_map.get(channelid.toString());
            let user = this.getUser(event.userid);
            chan.channelMessage(user, event.message, when);

        }
        else if(eventtype === "STARTQUERY") {
            let user = this.addUser(event.user);
        }
        else if(eventtype === "QUERY_MESSAGE") {
            let user = this.getUser(event.userid);
        }
        else {
            console.error("Couldn't handle event", event);
        }
    },

    getUser(userid) {
        return this.get(`users_map.${userid}`);
    },

    removeUser(userid) {
        console.log("removeUser", userid);
        let users = this.get("users");
        users.removeObject(userid);
        delete this.get("users_map.${userid}");
    },

    addUser(user) {
        console.log("addUser", user);
        let u = this.get(`users_map.${user.id}`)
        if(u === undefined) {
            let u = User.create(user);
            this.get("users").pushObject(user.id);
            this.get("users_map").set(user.id.toString(), u);
        }
        return user;
    },
});

var User = Ember.Object.extend({
    query: false
});

var Channel = Ember.Object.extend({
    name: '',

    init(group) {
        console.log(`channel ${this.name} init`);
        this.set('users', Ember.A());
        this.set('users_map', Ember.Object.create());
        this.set('events', Ember.A());
        this.set('group', group);
    },
    addUser(user) {
        let u = this.get(`users_map.${user.id}`)
        let users = this.get("users");
        let users_map = this.get("users_map");
        if(!users.contains(user.id)) {
            users.pushObject(user.id);
            users_map.set(user.id.toString(), user);
        }
    },
    removeUser(user) {
        let users = this.get("users");
        users.removeObject(user.id);
        delete this.get("users_map.${user.id}");
    },
    getUser(userid) {
        return this.get(`users_map.${userid}`);
    },

    userJoin(user, when) {
        let row = {};
        row.when = when;
        row.type = "USERJOIN";
        row.user = user;
        this.addUser(user);
        this.get("events").pushObject(row);
    },
    userPart(user, when) {
        let row = {};
        row.when = when;
        row.type = "USERPART";
        row.user = user;
        this.removeUser(user);
        this.get("events").pushObject(row);
    },
    userNickChange(user, oldnick, when) {
        let row = {};
        row.when = when;

        row.type = "NICKCHANGE";
        row.user = user;
        row.oldnick = oldnick;
        row.newnick = user.name;
        this.get("events").pushObject(row);
    },
    channelMessage(user, message, when) {
        let row = {};

        row.type = "CHANNEL_MESSAGE";
        row.user = user;
        row.message = message;
        row.when = when;
        this.get("events").pushObject(row);

    }
});

export default Ember.Service.extend({
    socketService: Ember.inject.service('websockets'),
    auth: storageFor('auth'),
    socket: null,

    init() {
        this._super(...arguments);
        console.log("converse-connector service init");
        let socket = this.get('socketService').socketFor('ws://localhost:5678/');

        socket.on('open', event => {
            this.myOpenHandler(event);
        });

        let _this = this;
        socket.on('message', (data) => {
            Ember.run(function() {
                _this.myMessageHandler(data);
            });
        });
        socket.on('close', event => { /* anonymous functions work as well */ });

        this.set('socket', socket);

        this.set('groups', Ember.A());
        this.set('groups_map', Ember.Object.create());
        this.set('authenticated', false);
        this.set('logintries', 0);
    },

    login() {
        console.log("Login", this.get('auth.username'), this.get('auth.password'));
        let username = this.get("auth.username");
        let password = this.get("auth.password");
        this.get('socket').send(`${username} ${password}\n`);
        this.set("logintries", this.get("logintries") + 1);
    },

    myOpenHandler: function(event) {
        console.log('On open event has been called: ' + event);
        this.login();
    },

    myMessageHandler: function(data) {
        /*
         * this.channels = contains the keys, for iteration
         * this.channels_map = contains channel instances, indexed by channel id
         */
        if(data.data.startsWith("CONVERSE ")) {
            console.log("Handling converse response ", data.data);
            if(data.data.startsWith("CONVERSE AUTH 1001")) {
                console.log("Login successfull");
                this.set("authenticated", true);
            }
            if(data.data.startsWith("CONVERSE AUTH 1002")) {
                console.log("Login failed");
                this.set("authenticated", false);
            }
            return;
        }
        let event = Ember.$.parseJSON(data.data);

        console.log("handling event", event);

        let groups = this.get('groups');
        let groups_map = this.get('groups_map');

        let group;

        if(event.type === "CREATE_GROUP") {
            let g = event.group;
            if(!groups.contains(g.id)) {
                console.log(`Adding group ${g.id}`);
                group = Group.create({id: g.id, name: g.name});
                groups_map.set(g.id.toString(), group);
                groups.pushObject(g.id);
            }
            return;
        }
        else {
            group = groups_map.get(event.groupid.toString());
        }

        group.handleEvent(event);

    },
    inputHandler(groupid, channel, line) {
        let msg = null;

        console.log("service", line);
        if(line.startsWith('/')) {
            let remainder = line.substring(1).trim();
            if(remainder) {
                let parts = remainder.split(" ");

                switch(parts[0].toLowerCase().trim()) {
                    case "j":
                    case "join":
                        if(parts.length >= 2) {
                            msg = {
                                groupid: groupid,
                                type: "CHANNEL_JOIN",
                                name: parts[1],
                                key: parts[2]
                            };
                        }
                        break;
                    case "part":
                    case "leave":
                        // XXX optionally handle explicitly specific name?
                        msg = {
                            groupid: groupid,
                            type: "CHANNEL_PART",
                            channelid: channel.get('id')
                        };
                        break;
                    case 'save':
                        msg = {
                            groupid: groupid,
                            type: "GLOBAL_SAVE"
                        };
                        break;
                    case 'con':
                    case 'connect':
                        msg = {
                            groupid: groupid,
                            type: "GLOBAL_CONNECT",
                            args: parts.slice(1)
                        };
                        break;
                    default:
                        console.log("Unknown command", parts);
                }
            }
        }
        else {
            msg = {
                groupid: groupid,
                type: 'CHANNEL_MSG',
                channelid: channel.get('id'),
                message: line};

        }
        console.log("msg", msg);
        if(msg) {
            this.get('socket').send(
                JSON.stringify(msg)
            );
        }
    }
});
