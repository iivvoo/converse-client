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

    init() {
        console.log("Group init", this.name);
        this.set('channels_map', Ember.Object.create());
        this.set('channels', Ember.A());
    },

    ordered_channels: function() {
        let r = Ember.A();

        for(let c of this.get("channels")) {
            r.pushObject(this.get(`channels_map.${c}`));
        }
        return r;

    }.property("channels.[]")
});

var User = Ember.Object.extend({

});

var Channel = Ember.Object.extend({
    name: '',

    init() {
        console.log(`channel ${this.name} init`);
        this.set('users', Ember.A());
        this.set('users_map', Ember.Object.create());
        this.set('events', Ember.A());
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
        let u = User.create(user);
        if(this.get(`users_map.${user.id}`) === undefined) {
            this.get("users").pushObject(user.id);
            this.get("users_map").set(user.id.toString(), u);
        }
        return user;
    },

    addEvent(event) {
        let eventtype = event.type;
        let row = {};
        row.when = new Date(event.when);

        if(eventtype === 'USERJOIN') {
            let user = this.addUser(event.user);
            row.type = "USERJOIN";
            row.userid  = event.user.id;
        }
        if(eventtype === 'USERPART') {
            this.removeUser(event.userid);
            row.type = "USERPART";
            row.userid = event.userid;
        }
        if(eventtype === "CHANNEL_MESSAGE") {
            row.type = "CHANNEL_MESSAGE";
            row.userid = event.userid;
            row.message = event.message;
            row.when = event.when;
        }
        if(eventtype === "NICKCHANGE") {
            console.log(event);
            let user = this.getUser(event.userid);
            if(user) {
                console.log(user);
                let oldnick = user.name;
                // user os a plain old object, no observable
                user.set('name', event.nickname);
                row.type = "NICKCHANGE";
                row.userid = event.userid;
                row.oldnick = oldnick;
                row.newnick = event.nickname;
            }

        }
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
        this.set('firstChannelLoaded', false);
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
        let eventtype = event.type;
        let channel = event.channel;
        let channelid = event.channelid;

        let groups = this.get('groups');
        let groups_map = this.get('groups_map');

        let group;

        if(eventtype === "CREATE_GROUP") {
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

        console.log("Group context", group);
        let channels = group.get("channels");
        let channels_map = group.get('channels_map');

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
        else {
            // channel is just an integer id
            let chan = channels_map.get(channelid.toString());
            chan.addEvent(event);

        }
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
