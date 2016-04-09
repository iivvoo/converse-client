import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('show-channel/msggroup', 'Integration | Component | show channel/msggroup', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });"

  this.render(hbs`{{show-channel/msggroup}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:"
  this.render(hbs`
    {{#show-channel/msggroup}}
      template block text
    {{/show-channel/msggroup}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
