import Ember from 'ember';


var ConverseInfoGroup = Ember.Object.extend({
    /*
     * An infogroup contains specific information
     * to be displayed, usually multiple rows grouped
     * or multiple related events grouped
     */
    init() {
        this.user = this.user;
    },

    canHandle: function(event) {
        return false;
    }
});

var NickChangeInfoGroup = ConverseInfoGroup.extend({
    type: 'NICKCHANGE',

    init() {
        this._super(...arguments);
        this.set('rows', Ember.A());
        this.lastwhen = null;

        this.addRow(this.event, this.user);
    },

    addRow: function(event, user) {
        this.get('rows').addObject({
            event: event,
            user: user,
            oldnick: event.oldnick,
            newnick: event.newnick
        });
    },

    canHandle: function(event, user) {
        if(event.type === 'NICKCHANGE' && this.get("user.id") === event.user.id) {
            this.addRow(event, user);
            return true;
        }
        return false;
    }

});

var JoinPartInfoGroup = ConverseInfoGroup.extend({
    /*
     * Group join/parts into a single InfoGroup
     */
    type: 'JOINPART',

    init() {
        this._super(...arguments);
        this.set('rows', Ember.A());
        this.lastwhen = null;

        this.addRow(this.event, this.user);
    },

    addRow: function(event, user) {
        if(event.type === 'USERJOIN') {
            this.get('rows').addObject({
                type: 'join',
                when: event.when,
                user: user
            });
        }
        else { // must be USERPART
            this.get('rows').addObject({
                type: 'part',
                when: event.when,
                user: user
            });
        }

    },
    canHandle: function(event, user) {
        let last = this.get('rows.lastObject');
        let lastwhen = last? last.when: null;

        if(event.type !== 'USERJOIN' && event.type !== 'USERPART') {
            return false;
        }
        // if a few seconds have passed and there are not a lot of join/parts,
        // make it be a separate line. Possibly the quieter it is, the smaller
        // the difference can be (not implemented yet)
        if(lastwhen && (event.when - lastwhen > 5000)) {
            return false;
        }
        this.addRow(event, user);

        return true;
    }
});


var MSGInfoGroup = ConverseInfoGroup.extend({
    /*
     * Group multiple messages from the same user into
     * a single group
     */
    type: 'MSG',
    user: '',

    init() {
        this._super(...arguments);
        this.set('rows', Ember.A());
        this.addRow(this.data);
    },

    addRow: function(data) {
        this.get('rows').pushObject({when: data.when,
                               message:data.message});
    },

    canHandle: function(event, user) {
        if(event.type === 'CHANNEL_MESSAGE' && this.get("user.id") === event.user.id) {
            this.addRow(event);
            return true;
        }
        return false;
    }
});

export default Ember.Component.extend({
    tagName: 'div',
    classNames: ['single-target', 'target-show'], // obsolete

    channel: null,
    converseConnector: Ember.inject.service('converse-connector'),

    input_line: '',


    /*
     Only scroll down if visible. Do scroll down when becoming visible
     */
    scrollDown: Ember.observer('infogroups.[]', 'infogroups.lastObject.rows.[]', function() {
        let container = this.$(".target-messages")[0];

        // If the user scrolled back a bit (40px, arbitrary),
        // don't scroll down.
        let diff = container.scrollHeight - (container.scrollTop + container.clientHeight);
        if(diff < 80) {
            Ember.run.later(container, function() {
                this.scrollTop = this.scrollHeight;
            }, 100);
        }
    }),

    infogroups: function() {
        let r = Ember.A();

        /*
         * Only handle last 200 events, which should be enough to fill
         * plenty of backlog. But eventually cache some of the data
         * in stead of rebuilding infogroups with each new event
         */
        for(let e of this.get("channel.events").slice(-200)) {
            let last = r.get("lastObject");
            let user = e.user;
            if(last && last.canHandle(e, user)) {
                continue;
            }

            if(e.type === 'USERJOIN' || e.type === 'USERPART') {
                let n = new JoinPartInfoGroup({event:e, user: user});
                r.pushObject(n);
            }
            if(e.type === 'NICKCHANGE') {
                let n = new NickChangeInfoGroup({event: e, user: user});
                r.pushObject(n);
            }
            if(e.type === 'CHANNEL_MESSAGE') {
                let n = new MSGInfoGroup({data:e, user:user});
                r.pushObject(n);
            }
        }

        return r;
    }.property("channel.events.[]"),

    users: function() {
        let r = Ember.A();

        // debugger;
        for(let c of this.get("channel.users")) {
            r.pushObject(this.get(`channel.users_map.${c}`));
        }
        return r;
    }.property("channel.users.[]"),

    inputhandler(channel, line) {
        // to be passed in to component
    },
    handle_input() {
        let line = this.get('input_line');

        if(line !== '') {
            console.log(`Input ${this.input_line}`);
            this.get('inputhandler')(this.channel, line);
            this.set("input_line", "");
        }
        return false;
    }
});
