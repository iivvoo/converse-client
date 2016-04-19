import Ember from 'ember';
import { storageFor } from 'ember-local-storage';

export default Ember.Controller.extend({
    auth: storageFor('auth'),
    converseConnector: Ember.inject.service('converse-connector'),

    init() {
        this.get('converseConnector');
    },
    checkAuth: Ember.observer("converseConnector.authenticated",
                              "converseConnector.logintries", function(){
        let state = this.get("converseConnector.authenticated");
        let tries = this.get("converseConnector.logintries");
        console.log("checkAuth", state, tries);
        if(state) {
            this.transitionToRoute("protected");
        }
        else {
            console.log("Try again");
        }
    }),

    actions: {
        authenticate() {
            console.log("Auth", this.get("username"), this.get("password"));
            let a = this.get("auth");
            a.set("username", this.get("username"));
            a.set("password", this.get("password"));
            this.get("converseConnector").login();
        }
    }
});
