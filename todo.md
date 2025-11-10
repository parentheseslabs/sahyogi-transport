Lead(Customer) -> (comes from say IndiaMart)Enquiry(status is initially open, then change status to bidding once bidding is started, brokers will be shortlisted for the enquiry and then we start whatsapp campaign to get their bids, after selecting the best bid we add a margin create a Quote, this quote will now be attached to the lead. send quote to the lead. now bargaining begins on the quote. Every time a new offer is made it is a new quote. All this quotes are attached to the lead. Finally, one quote will be accepted by the lead and finally it transcends into an order)
Brokers -> Bids

Lead 1..* Enquiry
Enquiry 1..* Bids
Enquiry 1..* Quotes

Leads -> Customers (DONE)
Orders -> Truck Orders (DONE)
Enquiries -> Customer Enquiries (DONE)
For truck order write #ID => TO<ID> (DONE for all entities)
Remove View sign for Transport Orders (DONE)
$ Rupee coming together (DONE)
Add filters for quotes, customer enquiries page, transport rate enquiries page (DONE)
Fix dashboard recent activity (PENDING)
Also need to add date filters in other pages (DONE)
API request logger (DONE)
Add ability to promote transport enquiry to transport order in customer enquiry (DONE)

add ability to search by customer enquiry id in the search bar