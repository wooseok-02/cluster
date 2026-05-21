import math


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """두 GPS 좌표 간 거리를 미터 단위로 반환 (Haversine 공식)"""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    # a: 두 점 사이 원호의 절반에 해당하는 값 (0~1 사이)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2

    # c: 두 점 사이의 중심각 (라디안)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c # 두 지점 간 거리 (미터)
