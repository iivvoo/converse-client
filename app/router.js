import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('group', {
    path: ':group_id'
  }, function() {
    this.route('channel', {
      path: ':channel_id'
    }, function() {});
  });
});

export default Router;
