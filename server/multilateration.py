import numpy as np
from scipy.optimize import leastsq


def locate(beacon_locs, distances, weights=None):
    beacon_locs = np.asarray(beacon_locs)
    distances = np.asarray(distances)
    if weights is not None:
        weights = np.asarray(weights)

    def loss(pos):
        d = np.linalg.norm(beacon_locs - pos[:2], axis=1)
        error = (distances * pos[2] - d) / distances
        if weights is not None:
            error *= weights
        return error

    initial_pos = np.average(beacon_locs, weights=1.0/distances, axis=0)
    x0 = np.append(initial_pos, 1)
    p, _ = leastsq(loss, x0)
    pos = p[:2]
    print(p, len(distances), weights)
    return pos


if __name__ == "__main__":
    beacon_locs = np.asarray([
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10]
    ])
    pos = [5, 6]
    error_std = 0.5
    distances = []
    for b in beacon_locs:
        d = np.linalg.norm(b - pos) + np.random.normal(scale=error_std)
        distances.append(d)
    distances = np.asarray(distances)

    calc_pos = locate(beacon_locs, distances)
    print(pos)
    print(calc_pos)
