import Ember from 'ember';

export default Ember.Controller.extend({
    converseConnector: Ember.inject.service('converse-connector'),

    groups: function() {
        let r = Ember.A();

        for(let c of this.get("converseConnector.groups")) {
            r.pushObject(this.get(`converseConnector.groups_map.${c}`));
        }
        return r;
    }.property("converseConnector.groups.[]"),

});
