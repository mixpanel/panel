describe('Simple Component instance', function() {
  var el;

  beforeEach(function() {
    document.body.innerHTML = '';
    el = document.createElement('simple-app');
  });

  context('before attached to DOM', function() {
    it('does not affect the DOM', function(done) {
      expect(document.getElementsByClassName('foo')).to.be.empty;
      window.requestAnimationFrame(function() {
        expect(document.getElementsByClassName('foo')).to.be.empty;
        done();
      });
    });

    it('allows state setting', function(done) {
      el.state = {foo: 'not bar'};
      document.body.appendChild(el);
      expect(el.state.foo).to.equal('not bar');
      window.requestAnimationFrame(function() {
        expect(el.state.foo).to.equal('not bar');
        done();
      });
    });

    it('allows updates and applies them when attached', function(done) {
      el.update({foo: 'not bar'});
      document.body.appendChild(el);
      expect(el.state.foo).to.equal('not bar');
      window.requestAnimationFrame(function() {
        expect(el.state.foo).to.equal('not bar');
        expect(el.textContent).to.contain('Value of foo: not bar');
        expect(el.textContent).to.contain('Foo capitalized: Not bar');
        done();
      });
    });
  });

  context('when attached to DOM', function() {
    beforeEach(function(done) {
      document.body.appendChild(el);
      window.requestAnimationFrame(function() {
        done();
      });
    });

    it('renders its template', function() {
      expect(document.getElementsByClassName('foo')).to.have.lengthOf(1);
      expect(el.children).to.have.lengthOf(1);
      expect(el.children[0].className).to.equal('foo');
    });

    it('injects default state into templates', function() {
      expect(el.textContent).to.contain('Value of foo: bar');
    });

    it('injects helpers into templates', function() {
      expect(el.textContent).to.contain('Foo capitalized: Bar');
    });

    it('re-renders when state is updated', function(done) {
      expect(el.textContent).to.contain('Value of foo: bar');
      expect(el.textContent).to.contain('Foo capitalized: Bar');
      el.update({foo: 'new value'});
      window.requestAnimationFrame(function() {
        expect(el.textContent).to.contain('Value of foo: new value');
        expect(el.textContent).to.contain('Foo capitalized: New value');
        done();
      });
    });

    it('does not re-render if shouldUpdate() returns false', function(done) {
      expect(el.textContent).to.contain('Value of foo: bar');

      el.update({foo: 'meow'});
      window.requestAnimationFrame(function() {
        expect(el.textContent).to.contain('Value of foo: bar'); // no change

        el.update({foo: 'something else'});
        window.requestAnimationFrame(function() {
          expect(el.textContent).to.contain('Value of foo: something else');
          done();
        });
      });
    });
  });

  context('when using shadow DOM', function() {
    beforeEach(function(done) {
      el = document.createElement('shadow-dom-app');
      document.body.appendChild(el);
      window.requestAnimationFrame(function() {
        done();
      });
    });

    it('creates and uses a shadow root', function() {
      expect(el.el).not.to.equal(el);
      expect(el.shadowRoot).to.be.ok;
    });

    it('renders its template', function() {
      expect(document.getElementsByClassName('foo')).to.have.lengthOf(0);
      expect(el.children).to.have.lengthOf(0);
      expect(el.shadowRoot.children[1].className).to.equal('foo');
    });

    it('applies the styles', function() {
      expect(el.shadowRoot.children[0].innerHTML).to.equal('color: blue;');
    });

    context('when applying override styles', function() {
      it('appends the overriding styles to the default styles', function(done) {
        el.setAttribute('style-override', 'background: red;');
        window.requestAnimationFrame(function() {
          expect(el.shadowRoot.children[0].innerHTML).to.equal('color: blue;background: red;');
          done();
        });
      });

      it("it applies the styles even if the component isn't attached to the DOM", function() {
         el = document.createElement('shadow-dom-app');
         el.setAttribute('style-override', 'background: red;');
         expect(el.shadowRoot.children[0].innerHTML).to.equal('color: blue;background: red;');
      });
    });
  });
});

describe('Nested Component instance', function() {
  var el, childEl;

  context('before child is rendered', function() {
    beforeEach(function() {
      document.body.innerHTML = '';
      childEl = null;
      el = document.createElement('nested-app');
    });

    it('passes state updates from child to parent', function() {
      el.attachedCallback();
      childEl = document.createElement('nested-child');
      childEl.setAttribute('panel-parent', el.panelID);
      childEl.$panelParent = childEl.$panelRoot = el;
      childEl.attachedCallback();
      childEl.update({animal: 'capybara'});
      expect(el.state.animal).to.equal('capybara');
    });
  });

  context('when attached to DOM', function() {
    beforeEach(function(done) {
      document.body.innerHTML = '';
      el = document.createElement('nested-app');
      document.body.appendChild(el);
      window.requestAnimationFrame(function() {
        childEl = el.getElementsByTagName('nested-child')[0];
        done();
      });
    });

    it('renders the parent component', function() {
      expect(document.getElementsByClassName('nested-foo')).to.have.lengthOf(1);
      expect(el.children).to.have.lengthOf(1);
      expect(el.children[0].className).to.equal('nested-foo');
    });

    it('renders the child component', function() {
      expect(document.getElementsByClassName('nested-foo-child')).to.have.lengthOf(1);
      expect(childEl.children[0].className).to.equal('nested-foo-child');
    });

    it('passes parent state to the child component', function() {
      expect(childEl.textContent).to.include('parent title: test');
    });

    it('passes attributes to the child component', function() {
      expect(childEl.textContent).to.include('animal: llama');
    });

    it('passes state updates from parent to child', function(done) {
      expect(childEl.textContent).to.include('animal: llama');
      el.update({animal: 'capybara'});
      window.requestAnimationFrame(function() {
        expect(childEl.textContent).to.include('animal: capybara');
        done();
      });
    });

    it('passes state updates from child to parent', function(done) {
      expect(el.textContent).to.include('Nested app: test');
      expect(childEl.textContent).to.include('parent title: test');
      childEl.update({title: 'new title'});
      window.requestAnimationFrame(function() {
        expect(el.textContent).to.include('Nested app: new title');
        expect(childEl.textContent).to.include('parent title: new title');
        done();
      });
    });
  });
});
