from django.core import signing

EMAIL_CHANGE_SALT = "accounts.email-change"


def make_email_change_token(user_id, new_email):
    return signing.dumps(
        {"user_id": user_id, "new_email": new_email}, salt=EMAIL_CHANGE_SALT
    )


def read_email_change_token(token, max_age_seconds=60 * 60 * 24):
    return signing.loads(token, salt=EMAIL_CHANGE_SALT, max_age=max_age_seconds)
