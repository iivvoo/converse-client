import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        let group = this.modelFor('group');
        if(group) {
            return group.get('channels_map').get(params.channel_id);
        }
    },

    afterModel(model) {
        if(!model) {
            this.transitionTo('application');
        }
    }
});
