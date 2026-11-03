// Shared behaviour for all pages. Each block only runs on the page that needs it.

// Contact form: no server is needed. The message opens in the visitor's email app.
(function () {
  var form = document.querySelector('.contact-form');
  if (!form) return;

  var note = form.querySelector('.form-note');

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var message = form.elements.message.value.trim();
    var to = form.dataset.mailto;

    var subject = 'Website message from ' + name;
    var body = message + '\n\nFrom: ' + name + ' (' + email + ')';

    window.location.href =
      'mailto:' + to +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    note.textContent = 'Your email app should open now. If it does not, write to us at ' + to + '.';
  });
})();
