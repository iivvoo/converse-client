import Ember from 'ember';

export default Ember.Component.extend({
    infogroup: null,

    message: function() {
        /*
         * Construct message with 'changed nick from' (because you will see
         * what is current). Also try to detect when nicknames change back.
         *
         * Samples:
         * .. changed nick from fubar123
         * .. changed nick to whatever12 and back
         */
        let rows = this.get("infogroup.rows");
        let last = rows.get("lastObject");
        let msg = `Changed nick from ${rows[0].oldnick}`;
        let middle = [];

        if(rows.length == 1) {
            return msg;
        }

        if(last.newnick == rows[0].oldnick) {
            for(let change of rows.slice(0,-1)) {
                middle.pushObject(` to ${change.newnick}`)
            }
            return msg + middle.join(", ") + ` and back to ${last.newnick}`
        }

        for(let e of rows.slice(0, -1)) {
            middle.pushObject(` to ${e.newnick}`);
        }
        return msg + middle.join(", ") + ` and finally to ${last.newnick}`;
    }.property("infogroup.rows.[]")

});
