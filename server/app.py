from aiohttp import web
from collections import defaultdict, deque
import time

import multilateration


"""
TODO:
    - Make distance calculation based on RSSI of signal (less latency that `distance`).
    - Use weighted LSQ https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3231493/
"""


class UserDatabase(object):
    def __init__(self, num_samples=1):
        self.num_samples = num_samples
        self.data = defaultdict(lambda: deque(maxlen=self.num_samples))

    def __setitem__(self, user, beacons):
        self.data[user].appendleft(beacons)

    def __getitem__(self, user):
        return list(self.data[user])


async def location_ping_handler(request):
    try:
        beacons = await request.json()
    except:
        return web.json_response("FAIL", 400)
    params = request.rel_url.query
    userid = params['userid']
    db = request.app['userdb']
    now = time.time()
    for b in beacons:
        b['id'] = f"{b['uuid']}.{b['major']}.{b['minor']}"
        b['timestamp'] = now
    db[userid] = beacons
    return web.json_response('OK')


async def location_handler(request):
    params = request.rel_url.query
    userid = params['userid']
    user_db = request.app['userdb']
    beacon_db = request.app['beacondb']
    observations = user_db[userid]
    if not observations:
        return web.json_response(None)
    beacon_locations = []
    distances = []
    times = []
    now = observations[0][0]['timestamp'] + 1
    for observation in observations:
        for s in observation:
            beacon_id = s['id']
            beacon_locations.append(beacon_db[beacon_id])
            distances.append(s['distance'])
            times.append(1 / (now - s['timestamp'])**2)
    position = multilateration.locate(beacon_locations, distances, weights=times)
    return web.json_response(position.tolist())


async def beacon_handler(request):
    db = request.app['beacondb']
    return web.json_response(db)


async def beacon_register_handler(request):
    try:
        location = await request.json()
    except:
        return web.json_response("FAIL", 400)
    params = request.rel_url.query
    uuid = params['uuid']
    minor = params['minor']
    major = params['major']
    db = request.app['beacondb']
    beacon_id = f"{uuid}.{major}.{minor}"
    db[beacon_id] = location
    return web.json_response('OK')


if __name__ == "__main__":
    app = web.Application()
    app['userdb'] = UserDatabase()
    app['beacondb'] = {
        '74278bda-b644-4520-8f0c-720eaf059935.4660.1': [3.65, 2.89],
        '74278bda-b644-4520-8f0c-720eaf059935.4660.2': [3.65, 0],
        '74278bda-b644-4520-8f0c-720eaf059935.4660.3': [0, 0],
        '74278bda-b644-4520-8f0c-720eaf059935.4660.4': [0, 2.89],
    }
    app.add_routes([
        web.get('/location', location_handler),
        web.post('/location/ping', location_ping_handler),
        web.get('/beacon', beacon_handler),
        web.post('/beacon/register', beacon_register_handler),
    ])
    
    web.run_app(app)
