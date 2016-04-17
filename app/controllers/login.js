import Ember from 'ember';
import { storageFor } from 'ember-local-storage';

export default Ember.Controller.extend({
    auth: storageFor('auth'),
    actions: {
        authenticate() {
            console.log("Auth", this.get("username"), this.get("password"));
            let a = this.get("auth");
            a.set("username", this.get("username"));
            a.set("password", this.get("password"));
            this.transitionToRoute("protected");
        }
    }
});
