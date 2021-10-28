import {Router2} from './router.js';
import {Route2} from './route.js';

(function () {
    function init() {
        var route2 = new Route2('about', 'about.html');
        var route1 = new Route2('home', 'home.html', true);

        var router = new Router2([
            route1,            
            route2
        ]);
    }
    init();
}());

