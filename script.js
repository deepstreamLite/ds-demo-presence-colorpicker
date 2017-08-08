(function() {
  var client = deepstream('wss://154.dsh.cloud?apiKey=e8d4940f-501f-4807-9b72-fd8a271332c9', { recordReadAckTimeout: 2000});
  var chart = null;
  var usersRecords = {};
  var userId = null;

  function render (update) {
    if(!chart) {
      chart = new Chart(
        document.getElementById("myChart").getContext("2d"),
        { type: 'pie', options: { responsive: false } }
      );
    }

    var colors = []
    var color = null
    for (userName in usersRecords) {
      color = usersRecords[userName].get('color')
      if (color) colors.push(color)
    }

    var noColorsSelected = colors.length === 0;
    displayFirstUser(noColorsSelected);

    if (JSON.stringify(colors) === JSON.stringify(chart.data.labels) || noColorsSelected)
      return;

    chart.data =  {
      datasets: [{
          data: colors.map(function () { return 1 }),
          backgroundColor: colors
      }],
      labels: colors
    };

    chart.update();
  }

  function displayFirstUser (isNoUsers) {
    $('#myChart').toggle(!isNoUsers)
    $('.first').toggle(isNoUsers)
  }

  /**
   * Tutorial starts here
   */

  function onColorSelected (color) {
    client.record.setData('users/' + userId, 'color', color)
    displayFirstUser(false)
  }

  function userLoggedIn(id) {
    usersRecords[id] = client.record.getRecord('users/' + id);
    usersRecords[id].subscribe('color', render, true);
    usersRecords[id].on('delete', function () {
      console.log('user record deleted', id)
    })
  }

  function userLoggedOut(id) {
    delete usersRecords[id];
    render();
  }

  function initializeApplication(data) {
    window.initialiseColorPicker('#color-picker', onColorSelected);

    userId = data.id;
   // onColorSelected(userId);

    client.presence.getAll(function (ids) {
      // requires comment why
      ids.push(userId);
      ids.forEach(userLoggedIn);
    });

    client.presence.subscribe(function (id, login) {
      if (login === true) {
        userLoggedIn(id)
      } else {
        userLoggedOut(id)
      }
    });
  }

  client.on('error', function ( error, event, topic ) {
    console.error(error, event, topic);
  });

  client.login({}, function(success, data) {
    if(!success) {
      console.log('failed to login')
      return ;
    }
    initializeApplication(data);
  });

  /*
  * Not very reliable
  */
  window.onbeforeunload = function (e) {
    // mention permissions here
    usersRecords[userId].delete();
  }

})();