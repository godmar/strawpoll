'use strict';

(function () {

var appBaseUrl = "https://strawpoll-1127.firebaseio.com";
var firebase = new Firebase(appBaseUrl);

var navtargets = {
    always : [
        { path: '/home', label: "Home", templateUrl: 'partials/home.html' },
    ],
    topbar : [
        { path: '/createpoll', label: "Create a Poll", templateUrl: 'partials/createpoll.html' },
        { path: '/poll', label: "Participate in a Poll", templateUrl: 'partials/participate.html' },
    ],
    rightbar : [
        // { path: '/mypolls', label: "My Polls", templateUrl: 'partials/mypolls.html' },
    ],
    invisible : [
        { path: '/login', label: "Login", templateUrl: 'partials/login.html' },
    ]
};

angular.module('StrawPollApp', [ 
    'ngRoute',    // so that $routeProvider can be injected
    'firebase',
    'googlechart' // https://github.com/angular-google-chart/angular-google-chart
])
.value('googleChartApiConfig', {
    version: '1',
    optionalSettings: {
        packages: ['corechart', 'gauge'],
        language: 'en'
    }
})
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    // $locationProvider.html5Mode({ enable: true, requireBase: false });

    // wire links to partials in ng-view
    for (var menuname in navtargets) {
        var menugroup = navtargets[menuname];
        for (var i = 0; i < menugroup.length; i++) {
            var item = menugroup[i];
            $routeProvider.when(item.path, { templateUrl: item.templateUrl });
        }
    }
    $routeProvider.otherwise({redirectTo: '/'});
}])
.controller('MainController', 
    ['$scope', '$firebaseAuth', '$location', '$timeout', function (scope, fbAuth, $location, $timeout) {
        // to hold auth information
        scope.user = { }

        scope.logout = function () {
            delete scope.user['auth'];
            fbAuth(firebase).$unauth();

            /* Ah, the joys of AngularJS.  Calling $location.path() here should work,
             * but it does not.  We are inside an AngularJS digest cycle already.
             */
            $timeout(function () {
                $location.path("/home");
            }, 1000);
        }

        scope.authenticate = function (authData) {
            console.log("Authenticated successfully with payload:");
            console.dir(authData);

            scope.user.auth = authData;
            if ('google' in authData)
                scope.user.name = authData.google.displayName;
            else
                scope.user.name = "Anonymous";
            $location.path("/home");
        }

        // check if user is still authenticated
        var auth = fbAuth(firebase);
        var authData = auth.$getAuth();
        if (authData)
            scope.authenticate(authData);

    }])
.controller('LoginController',
    ['$scope', '$firebaseAuth', '$location', function (scope, fbAuth, $location) {
        var auth = fbAuth(firebase);

        // to support login 
        scope.authAnonymously = function () {
            auth.$authAnonymously().then(function(authData) {
                scope.authenticate(authData);
            }).catch(function (error) {
                console.log("Login Failed!", error);
            });
        }

        scope.authViaGoogle = function () {
            auth.$authWithOAuthPopup("google").then(function (authData) {
                /* authData.google = {displayName: "Godmar Back", id: ..., profileImageURL: "") } */
                scope.authenticate(authData);
            }).catch(function (error) {
                console.log("Login Failed!", error);
            });
        }
    }])
.controller('NavController', 
    ['$scope', function (scope) {
        scope.navtargets = navtargets;
    }])
.controller('CreatePollController',
    ['$scope', '$firebaseArray', function (scope, $firebaseArray) {
        scope.question = {
            text: "What is your favorite JavaScript MVC Framework?",
            options: [ ]
        }
        scope.addOption = function () {
            var options = this.question.options;
            var lastLabel = options.length > 0 ? options[options.length-1].label : "@";
            var newLabel = String.fromCharCode(lastLabel.charCodeAt(0) + 1);
            this.question.options.push({
                label: newLabel,
                text: "Enter option here"
            });
        }
        scope.removeOption = function (label) {
            var options = this.question.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i].label == label) {
                    options.splice(i, 1);
                    break;
                }
            }
        }

        scope.saveQuestion = function () {
            var polls = $firebaseArray(new Firebase(appBaseUrl + "/polls"));
            polls.$add(scope.question).then(function (ref) {
                var id = ref.key();
                console.log("added new poll with id: " + id);
                // TBD: store id under user to be able to later find it
            });
        }
    }])
.controller('ParticipateController',
    ['$scope', '$firebaseArray', '$firebaseObject',
        'googleChartApiPromise', function (scope,
                    $firebaseArray, 
                    $firebaseObject,
                    googleChartAPIPromise) {

        scope.polls = $firebaseArray(new Firebase(appBaseUrl + "/polls"));
        scope.current = { poll : null };

        scope.selectPoll = function (poll) {
            this.current.poll = poll;
            var myVoteURL = appBaseUrl + "/votes/" + poll.$id + "/" + scope.user.auth.uid;
            console.log("my vote is stored at: " + myVoteURL);

            var myVote = $firebaseObject(new Firebase(myVoteURL));
            myVote.$bindTo(scope, "myvote");

            // add a column for each option
            var rows = [ ];
            var option2Row = { }
            poll.options.forEach(function (e) {
                var row = { c : [ { v: e.label }, { v : 0 }  ] };
                option2Row[e.label] = row.c[1];
                rows.push(row);
            });

            var chartObj = {
                data : {
                    cols : [
                        {id: "t", label: "Option", type: "string"},
                        {id: "s", label: "Votes", type: "number"}
                    ],
                    rows: rows
                },
                type: "BarChart",
                options: {
                    legend: { position: 'none' },
                    animation: {
                        "startup": true,
                        "duration" : 1000,
                        "easing": "in"
                    }
                }
            }

            var allVoteURL = appBaseUrl + "/votes/" + poll.$id;
            var allVotes = $firebaseArray(new Firebase(allVoteURL));
            function countTheVotes() {
                for (var k in option2Row)
                    option2Row[k].v = 0;

                allVotes.forEach(function (vote) {
                    option2Row[vote.voted].v++;
                });
            }

            allVotes.$loaded().then(function () {
                scope.current.results = chartObj;
            });

            allVotes.$watch(function (event, key) {
                // recount votes on each change
                // console.log("allvotes watch fired: " + event);
                countTheVotes();
            });
        }

        // if we need access to the google API object
        var google;
        googleChartAPIPromise.then(function (g) {
            google = g;
        });
    }])
;

})();
