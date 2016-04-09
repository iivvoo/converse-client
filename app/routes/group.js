import Ember from 'ember';

export default Ember.Route.extend({
    converseConnector: Ember.inject.service('converse-connector'),
    model(params) {
        let g = this.get('converseConnector').get('groups_map').get(params.group_id);
        console.log("model group", g);
        return g;
    }
});
