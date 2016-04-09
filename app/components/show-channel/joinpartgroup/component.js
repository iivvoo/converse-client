import Ember from 'ember';

export default Ember.Component.extend({
    infogroup: null,

    primary: Ember.computed('infogroup.rows.firstObject', function() {
        return this.get('infogroup.rows.firstObject');
    }),

    and_other_events: Ember.computed('infogroup.rows.[]', function() {
        let parts = [];
        let joined = 0;
        let left = 0;

        for(let e of this.get("infogroup.rows").slice(1)) {
            if(e.type === "join") {
                parts.pushObject(`${e.user.name} joined`);
                joined++;
            }
            else {
                parts.pushObject(`${e.user.name} left`);
                left++;
            }
        }
        if(joined + left > 10) {
            if(joined > 0 && left > 0) {
                return ", many joined and left and eventually " + parts.slice(-10).join(", ");
            }
            else if(joined > 0) {
                return ", many joined and eventually " + parts.slice(-10).join(", ");
            }
            else {
                return ", many left and eventually " + parts.slice(-10).join(", ");
            }
        }
        else if(joined + left > 1) {
            return "and " + parts.join(", ");
        }
        return '';
    })
});
