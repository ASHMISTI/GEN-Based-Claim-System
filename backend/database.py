claims_db = {}
claim_id_counter = 1


def add_claim(claim):
    global claim_id_counter
    claim["id"] = claim_id_counter
    claims_db[claim_id_counter] = claim
    claim_id_counter += 1
    return claim


def get_claims():
    return list(claims_db.values())