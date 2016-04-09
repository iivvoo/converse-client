import Ember from 'ember';

export default Ember.Component.extend({
    infogroup: null,

    firstLine: function() {
        return this.get("infogroup.rows.firstObject");
    }.property("infogroup.rows.firstObject"),

    remainingLines: function() {
        return this.get("infogroup.rows").slice(1);
    }.property("infogroup.rows.[]"),
});
