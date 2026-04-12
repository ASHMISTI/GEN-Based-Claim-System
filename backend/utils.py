def assess_damage(features):
    score = features.mean().item()
    if score < 0.2:
        return "Severe", 85
    elif score < 0.5:
        return "Moderate", 55
    else:
        return "Minor", 25


def decision(severity):
    if severity > 80:
        return "Replace", False
    elif severity > 50:
        return "Partial Refund", False
    else:
        return "Manual Review", True