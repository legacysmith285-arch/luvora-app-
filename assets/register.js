/* Client-side validation and submission for the Luvora registration form. */
(function () {
  var form = document.getElementById("registerForm");
  if (!form) return;

  var button = document.getElementById("submitButton");
  var formMessage = document.getElementById("formMessage");
  var toggle = document.getElementById("togglePassword");
  var passwordInput = document.getElementById("password");
  var dobInput = document.getElementById("dateOfBirth");

  // Nobody younger than 18 can be born after today minus 18 years.
  var today = new Date();
  var maxDob = new Date(Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()));
  dobInput.max = maxDob.toISOString().slice(0, 10);
  dobInput.min = "1900-01-01";

  toggle.addEventListener("click", function () {
    var showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    toggle.textContent = showing ? "Show" : "Hide";
    toggle.setAttribute("aria-pressed", String(!showing));
  });

  function fieldNode(name) {
    return form.querySelector('[data-field="' + name + '"]');
  }

  function clearErrors() {
    formMessage.textContent = "";
    formMessage.className = "form-message span-2";
    ["fullName", "username", "email", "password", "dateOfBirth", "country", "gender", "over18"]
      .forEach(function (name) {
        var node = fieldNode(name);
        if (node) node.classList.remove("invalid");
        var error = document.getElementById(name + "-error");
        if (error) error.textContent = "";
      });
  }

  function showErrors(errors, message) {
    var first = null;
    Object.keys(errors || {}).forEach(function (name) {
      var node = fieldNode(name);
      if (node) node.classList.add("invalid");
      var error = document.getElementById(name + "-error");
      if (error) error.textContent = errors[name];
      if (!first) first = node;
    });
    if (message) {
      formMessage.textContent = message;
      formMessage.className = "form-message span-2 bad";
    }
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function ageInYears(value) {
    var parts = value.split("-").map(Number);
    var now = new Date();
    var age = now.getUTCFullYear() - parts[0];
    var monthDiff = now.getUTCMonth() + 1 - parts[1];
    if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < parts[2])) age -= 1;
    return age;
  }

  function collect() {
    var gender = form.querySelector('input[name="gender"]:checked');
    return {
      fullName: form.fullName.value.trim(),
      username: form.username.value.trim().toLowerCase(),
      email: form.email.value.trim().toLowerCase(),
      password: form.password.value,
      dateOfBirth: dobInput.value,
      country: form.country.value,
      gender: gender ? gender.value : "",
      over18: form.over18.checked
    };
  }

  function validate(values) {
    var errors = {};
    if (values.fullName.length < 2) errors.fullName = "Please enter your full name.";
    if (!/^[a-z0-9_]{3,20}$/.test(values.username)) {
      errors.username = "Usernames are 3–20 characters: letters, numbers and underscores.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (values.password.length < 8) errors.password = "Passwords must be at least 8 characters.";
    if (!values.dateOfBirth) errors.dateOfBirth = "Please enter your date of birth.";
    else if (ageInYears(values.dateOfBirth) < 18) errors.dateOfBirth = "You must be 18 or older to join Luvora.";
    if (!values.country) errors.country = "Please select your country.";
    if (!values.gender) errors.gender = "Please select a gender.";
    if (!values.over18) errors.over18 = "Please confirm that you are 18 or older.";
    return errors;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    var values = collect();
    var errors = validate(values);
    if (Object.keys(errors).length > 0) {
      showErrors(errors, "Please check the highlighted fields.");
      return;
    }

    button.disabled = true;
    button.textContent = "Creating your account…";

    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        return { ok: response.ok, body: body };
      });
    }).then(function (result) {
      if (!result.ok) {
        showErrors(result.body.errors, result.body.message || "Something went wrong. Please try again.");
        return;
      }
      document.getElementById("successTitle").textContent =
        result.body.message || "Welcome to Luvora!";
      document.getElementById("formPanel").hidden = true;
      document.getElementById("successPanel").hidden = false;
      window.scrollTo(0, 0);
    }).catch(function () {
      showErrors(null, "We couldn't reach Luvora. Please check your connection and try again.");
    }).then(function () {
      button.disabled = false;
      button.textContent = "Create Account";
    });
  });
})();
