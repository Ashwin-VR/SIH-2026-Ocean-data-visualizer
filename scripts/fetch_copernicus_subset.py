"""Download a bounded Copernicus Marine subset for local demo preparation.

Credentials are supplied by the copernicusmarine CLI configuration or environment.
This script intentionally writes outside the web application's static tree.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import copernicusmarine


parser = argparse.ArgumentParser()
parser.add_argument('--dataset-id', default='cmems_mod_glo_phy-thetao_anfc_0.083deg_PT6H-i')
parser.add_argument('--variable', default='thetao')
parser.add_argument('--min-lon', type=float, default=45)
parser.add_argument('--max-lon', type=float, default=105)
parser.add_argument('--min-lat', type=float, default=-5)
parser.add_argument('--max-lat', type=float, default=22)
parser.add_argument('--min-depth', type=float, default=0)
parser.add_argument('--max-depth', type=float, default=1000)
parser.add_argument('--start', required=True)
parser.add_argument('--end', required=True)
parser.add_argument('--output', type=Path, default=Path('data/copernicus/temperature.nc'))
args = parser.parse_args()

args.output.parent.mkdir(parents=True, exist_ok=True)
copernicusmarine.subset(
    dataset_id=args.dataset_id,
    variables=[args.variable],
    minimum_longitude=args.min_lon,
    maximum_longitude=args.max_lon,
    minimum_latitude=args.min_lat,
    maximum_latitude=args.max_lat,
    minimum_depth=args.min_depth,
    maximum_depth=args.max_depth,
    start_datetime=args.start,
    end_datetime=args.end,
    output_filename=str(args.output),
    file_format='netcdf',
    overwrite=True,
)
print(args.output)
