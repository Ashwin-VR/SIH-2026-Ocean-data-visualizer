from app.argo import parse_argo_csv, fixture_profiles

CSV = '''time,latitude,longitude,platform_number,cycle_number,pres,temp,psal
UTC,degrees_north,degrees_east,,,decibar,degree_Celsius,PSU
2026-01-01T07:58:42Z,-3.42543,49.90202,1902025,336,0.92,29.523,NaN
2026-01-01T07:58:42Z,-3.42543,49.90202,1902025,336,26.08,28.960,NaN
'''


def test_parse_argo_csv_groups_profile_and_ignores_nan_salinity():
    profiles = parse_argo_csv(CSV)
    assert len(profiles) == 1
    profile = profiles[0]
    assert profile.platform == "1902025"
    assert profile.cycle == 336
    assert [p.depth for p in profile.points] == [0.92, 26.08]
    assert profile.points[0].observed == 29.523


def test_fixture_profiles_are_deterministic_and_nonempty():
    profiles = fixture_profiles()
    assert profiles
    assert profiles[0].platform == "1902025"
    assert len(profiles[0].points) >= 10
