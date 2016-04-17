import Ember from 'ember';
import { storageFor } from 'ember-local-storage';

export default Ember.Route.extend({
    auth: storageFor('auth'),

    model() {
        console.log("protected model", this.get('auth'));
        // get from local storage
        let username = this.get("auth.username");
        let password = this.get("auth.password");

        if(username && password) {
            return {username: username, password: password};
        }
        return null;
    },

    afterModel(model) {
        // if model is null / undefined, transitionTo login
        if(model === null) {
            this.transitionTo('login');
        }
    }
});
