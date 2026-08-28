import httpx

from app.argo import fetch_argo_profile


def test_fetch_argo_profile_uses_erddap_csv_contract(monkeypatch):
    csv = """time,latitude,longitude,platform_number,cycle_number,pres,temp,psal\nUTC,degrees_north,degrees_east,,,decibar,degree_Celsius,PSU\n2026-01-01T07:58:42Z,-3.4,49.9,1902025,336,1,29.5,NaN\n"""
    def handler(request: httpx.Request):
        assert "ArgoFloats.csv" in str(request.url)
        assert "platform_number" in str(request.url)
        return httpx.Response(200, request=request, text=csv)
    monkeypatch.setattr("app.argo.httpx.get", lambda url, **kwargs: httpx.Response(200, request=httpx.Request("GET", url), text=csv))
    profile = fetch_argo_profile("1902025", 336)
    assert profile.platform == "1902025"
