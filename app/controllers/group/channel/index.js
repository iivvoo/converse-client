import Ember from 'ember';

export default Ember.Controller.extend({
    groupController: Ember.inject.controller('group'),

    converseConnector: Ember.inject.service('converse-connector'),
    inputHandler(channel, line) {
        this.get('converseConnector').inputHandler(this.get('groupController.model.id'), channel, line);
    },

});
