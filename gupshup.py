import requests
import json
import urllib.parse

partner_email = "soumit@parentheseslabs.com"
partner_password = "CPABkE3tVqyCNhJQGNTb5tapz4fKLtJ4kHKxp_-5UC7KQ6RaTYmcfrTb_baL78ri"
heena_app_id = "df7f3273-8604-4c0f-aecd-4736f4911989"
test_app_id = "3553ab46-e985-4195-989d-9bb90653e439"


def fetch_partner_token(email: str, password: str) -> str:
  try:
    r = requests.post(
      "https://partner.gupshup.io/partner/account/login",
      data={
        "email": email,
        "password": password,
      },
      headers={
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    )
    body = r.json()
    return body["token"]
  except requests.exceptions.HTTPError as err:
    raise RuntimeError(f"Failed to fetch partner token (Status Code = {err.response.status_code}): {err.response.raw}")

def fetch_app_token(app_id: str, partner_token: str) -> str:
  try:
    r = requests.get(f"https://partner.gupshup.io/partner/app/{app_id}/token/", headers={
      "Authorization": partner_token
    })
    body = r.json()
    return body["token"]["token"]
  except requests.exceptions.HTTPError as err:
    raise RuntimeError(f"Failed to fetch partner token (Status Code = {err.response.status_code}): {err.response.raw}")

def fetch_subscriptions(app_id: str, app_token: str) -> list:
  try:
    r = requests.get(f"https://partner.gupshup.io/partner/app/{app_id}/subscription", headers={"Authorization": app_token})
    body = r.json()
    print(body)
    return body["subscriptions"]
  except requests.exceptions.HTTPError as err:
    raise RuntimeError(f"Failed to fetch partner token (Status Code = {err.response.status_code}): {err.response.raw}")

def delete_subscription(app_id: str, subscription_id: str, app_token: str):
  try:
    r = requests.delete(f"https://partner.gupshup.io/partner/app/{app_id}/subscription/{subscription_id}", headers={
      "Authorization": app_token
    })
  except requests.exceptions.HTTPError as err:
    raise RuntimeError(f"Failed to fetch partner token (Status Code = {err.response.status_code}): {err.response.raw}")
  pass

def clean_ngrok_subscriptions(app_id: str, app_token: str):
  subs = fetch_subscriptions(app_id=app_id, app_token=app_token)
  for sub in subs:
    sub_url = sub["url"]
    sub_id = sub["id"]
    sub_tag = sub["tag"]
    hostname = urllib.parse.urlparse(sub_url).hostname
    if issubclass(type(hostname), str) and hostname.endswith(".ngrok-free.app"):
      print(f"Deleting subscription: {sub_id} {sub_url} {sub_tag}")
      try:
        delete_subscription(app_id=app_id, subscription_id=sub_id, app_token=app_token)
        print("Successfully deleted subscription")
      except RuntimeError as e:
        print(f"Failed to delete subscription {e}")
  pass

def clean_subscription_with_tag(app_id: str, tag: str, app_token: str):
  subs = fetch_subscriptions(app_id=app_id, app_token=app_token)
  for sub in subs:
    if sub["tag"] == tag:
      delete_subscription(app_id=app_id, subscription_id=sub["id"], app_token=app_token)
  pass

def get_waba_info(app_id: str, app_token: str):
  try:
    r = requests.get(f"https://partner.gupshup.io/partner/app/{app_id}/waba/info/", headers={"Authorization": app_token})
    return r.json()["wabaInfo"]
  except requests.exceptions.HTTPError as err:
    raise RuntimeError(f"Failed to fetch partner token (Status Code = {err.response.status_code}): {err.response.raw}")

def get_templates(app_id: str, app_token: str):
  try:
    r = requests.get(f"https://partner.gupshup.io/partner/app/{app_id}/templates", headers={"Authorization": app_token})
    return r.json()["templates"]
  except requests.exceptions.HTTPError as err:
    raise RuntimeError(f"Failed to fetch partner token (Status Code = {err.response.status_code}): {err.response.raw}")

def send_bid_template(app_id: str, app_token: str, to_phone_number: str, template_name: str, enquiry_details: str, flow_id: str, flow_token: str, flow_data: dict = None):
  """
  Send a bid flow template to a phone number for testing
  
  Args:
    app_id: Gupshup app ID
    app_token: App token from Gupshup
    to_phone_number: Phone number to send to (with country code, e.g., "918727306226")
    template_name: Template name (e.g., "kiran_transport_bid")
    enquiry_details: Formatted enquiry details string
    flow_id: Flow ID for the bid form
    flow_token: Unique token to track this bid request
    flow_data: Dictionary containing flow data parameters (enquiryId, from, to, cargoType, etc.)
  
  Returns:
    Response from Gupshup API
  """
  try:
    template_message = {
      "messaging_product": "whatsapp",
      "recipient_type": "individual", 
      "to": to_phone_number,
      "type": "template",
      "template": {
        "name": template_name,
        "language": {
          "code": "en"
        },
        "components": [
          {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": enquiry_details
              }
            ]
          },
          {
            "type": "button",
            "sub_type": "flow",
            "index": "0",
            "parameters": [
              {
                "type": "action",
                "action": {
                  "flow_token": flow_token,
                  "flow_action_data": {
                    "flow_id": flow_id,
                    "navigate_screen": "BID_FORM",
                    **(flow_data if flow_data else {})
                  }
                }
              }
            ]
          }
        ]
      }
    }

    headers = {
      "Authorization": app_token,
      "Content-Type": "application/json"
    }
    
    r = requests.post(
      f"https://partner.gupshup.io/partner/app/{app_id}/v3/message",
      json=template_message,
      headers=headers
    )
    
    r.raise_for_status()
    response = r.json()
    print("Template message sent successfully!")
    print(json.dumps(response, indent=2))
    return response
    
  except requests.exceptions.HTTPError as err:
    print(f"HTTP Error: {err.response.status_code}")
    print(f"Response: {err.response.text}")
    raise RuntimeError(f"Failed to send template message (Status Code = {err.response.status_code}): {err.response.text}")
  except Exception as err:
    print(f"Error: {err}")
    raise

def test_send_bid_template():
  """
  Test function to send a sample bid template
  """
  # Get tokens
  partner_token = fetch_partner_token(partner_email, partner_password)
  test_app_token = fetch_app_token(app_id=test_app_id, partner_token=partner_token)
  
  # Sample enquiry details matching your template format (fixed formatting)
  enquiry_details = "📋 *Enquiry 24* 📍 *Route:* Mumbai → Thane 📦 *Cargo:* Furniture ⚖️ *Weight:* 2.4 MT 🚛 *Vehicle:* Truck 📝 *Remarks:* Available on saturday only"

  # Test parameters
  to_phone_number = "917595903437"  # Replace with your test number
  template_name = "kiran_transport_bid"
  flow_id = "24105313799145675"
  flow_token = f"test_bid_token_{json.dumps({'enquiry_id': 24, 'broker_id': 1, 'timestamp': 1762783949045})}"
  
  # Flow data parameters that will be passed to the flow screen
  flow_data = {
    "enquiryId": "24",
    "from": "Mumbai", 
    "to": "Thane",
    "cargoType": "Furniture",
    "cargoWeight": "2.4",
    "remarks": "Available on saturday only",
    "vehicleType": "Truck"
  }
  
  print(f"Sending bid template to {to_phone_number}")
  print(f"Template: {template_name}")
  print(f"Flow ID: {flow_id}")
  print(f"Flow Token: {flow_token}")
  print("Enquiry Details:")
  print(enquiry_details)
  print("Flow Data:")
  print(json.dumps(flow_data, indent=2))
  print("-" * 50)
  
  try:
    response = send_bid_template(
      app_id=test_app_id,
      app_token=test_app_token,
      to_phone_number=to_phone_number,
      template_name=template_name,
      enquiry_details=enquiry_details,
      flow_id=flow_id,
      flow_token=flow_token,
      flow_data=flow_data
    )
    return response
  except Exception as e:
    print(f"Failed to send bid template: {e}")
    return None
# Template ID from your provided template: 3c81ed9b-8360-4581-a914-eb2921333846
if __name__ == "__main__":
  partner_token = fetch_partner_token(partner_email, partner_password)
  heena_app_token = fetch_app_token(app_id=heena_app_id, partner_token=partner_token)
  test_app_token = fetch_app_token(app_id=test_app_id, partner_token=partner_token)

  # Uncomment any of the following lines to run different tests:
  
  # Test sending bid template
  print("=== Testing Bid Template ===")
  test_send_bid_template()
  
  # Other available tests:
  # print("<<Heena Subscriptions>>")
  # print(json.dumps(fetch_subscriptions(app_id=heena_app_id, app_token=heena_app_token), indent=4))
  # print("<<Test Subscriptions>>")
  # print(json.dumps(fetch_subscriptions(app_id=test_app_id, app_token=test_app_token), indent=4))
  # clean_ngrok_subscriptions(test_app_id, test_app_token)
  # clean_subscription_with_tag(app_id=test_app_id, tag="heena_jwellers_listener", app_token=test_app_token)
  # print(json.dumps(get_waba_info(app_id=test_app_id, app_token=test_app_token), indent=2))
  # print(json.dumps(get_waba_info(app_id=heena_app_id, app_token=heena_app_token), indent=2))
  # print(json.dumps(get_templates(app_id=test_app_id, app_token=test_app_token), indent=2))
