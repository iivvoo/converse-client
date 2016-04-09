import Ember from 'ember';
import moment from 'moment';

export function timestampFormat(params) {
  return moment(params[0]).format("HH:MM");
}

export default Ember.Helper.helper(timestampFormat);
