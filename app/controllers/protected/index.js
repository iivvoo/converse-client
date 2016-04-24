import Ember from 'ember';

export default Ember.Controller.extend({
    /*
     * A bit of a hack but.. will redirect to the first loaded channel once
     * available. Somehow converse-connector initialization needs to be
     * enforiced in init() by get()ing it or the observer won't work
     */
    converseConnector: Ember.inject.service('converse-connector'),

    init() {
        this.get('converseConnector');
        let gid = this.get('converseConnector.groups.firstObject');
        let cid = this.get(`converseConnector.groups_map.${gid}.channels.firstObject`)
        if(typeof cid !== 'undefined') {
            this.redirectToFirstChannel()
        }
    },

    redirectToFirstChannel() {
        let gid = this.get('converseConnector.groups.firstObject');
        let cid = this.get(`converseConnector.groups_map.${gid}.channels.firstObject`)

        this.transitionToRoute('group.channel', gid, cid);

    },
    redirectOnLoaded: Ember.observer(
        'converseConnector.groups.@each.firstChannelLoaded',
        function() {
            this.redirectToFirstChannel();
    })
});
