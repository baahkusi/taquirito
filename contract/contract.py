import smartpy as sp


class SafeChain(sp.Contract):
    
    def __init__(self, manager, spare):
        
        self.init(
            certifiers=sp.map(tkey=sp.TString, tvalue=sp.TAddress),
            products=sp.big_map(
                tkey=sp.TString, 
                tvalue=sp.TRecord(**{'certifier':sp.TString, 
                'metahash':sp.TList(sp.TMap(sp.TString, sp.TString)), 'lookups':sp.TNat})),
            manager=manager,
            spare=spare
            )
    
    def assert_manager(self):
        sp.verify_equal(sp.sender, self.data.manager, message ="Unauthorized account. Only manager can peform this action.")
        
    
    @sp.entry_point
    def update_certifiers(self, params):
        self.assert_manager()
        
        sp.for cert in params.certifiers.items():
            self.data.certifiers[cert.key] = cert.value
    
    @sp.entry_point
    def add_items(self, params):
        sp.verify(self.data.certifiers.contains(params.id), message ='Certifier with ID non-existent')
        sp.verify_equal(sp.sender, self.data.certifiers[params.id], message ="This account may be expired, use different account.")
        
        sp.for product in params.products.items():
            sp.if self.data.products.contains(product.key):
                sp.verify_equal(params.id, self.data.products[product.key].certifier, message ="This product has already been registered by another certifier institution.")
                self.data.products[product.key].metahash.push(product.value)
            sp.else:
                self.data.products[product.key] = sp.record(certifier=params.id, metahash=[product.value], lookups=0)

    @sp.entry_point
    def register_lookup(self, params):
        self.assert_manager()
        
        sp.verify(self.data.products.contains(params.itemHash), message ="Item Does not exists")
        
        self.data.products[params.itemHash].lookups += 1
    
    @sp.entry_point
    def change_manager(self, params):
        sp.verify_equal(sp.sender, self.data.spare, message ="Unauthorized account. Only spare can peform this action.")
        
        self.data.manager = params.manager


@sp.add_test(name = 'SafeChain Tests')
def test():
    
    sc = sp.test_scenario()
    
    spare = sp.test_account("Ejara Spare")
    
    manager = sp.test_account("Ejara")
    
    cert1 = sp.test_account("Certifier 1")
    cert2 = sp.test_account("Certifier 2")
    cert3 = sp.test_account("Certifier 3")

    c = SafeChain(manager.address, spare.address)
    
    sc.h1('Run Valid Tests')
    
    sc += c
    
    sc.h2('Add Certifiers')
    
    certifiers = {
        'C1ID': cert1.address,
        'C2ID': cert2.address,
        'C3ID': cert3.address
    }
    
    sc += c.update_certifiers(certifiers=certifiers).run(sender=manager)
    
    sc.h2('Add Items')
    
    items = {
        "item1": {'name': 'item1 name hash', 'lot':'item1 lot hash'},
        "item2": {'name': 'item2 name hash', 'lot':'item2 lot hash'},
        "item3": {'name': 'item3 name hash', 'lot':'item3 lot hash'},
    }
    
    sc.register(c.add_items(id='C1ID', products=items).run(sender=cert1))
    
    sc += c.add_items(id='C1ID', products=items).run(sender=cert1)
    
    sc.h2('Register Lookup')
    
    sc.register(c.register_lookup(itemHash='item1').run(sender=manager))
    sc.register(c.register_lookup(itemHash='item2').run(sender=manager))
    sc.register(c.register_lookup(itemHash='item3').run(sender=manager))
    sc += c.register_lookup(itemHash='item1').run(sender=manager)
    
    sc.h2('Change Manager')
    
    new_manager = sp.test_account("Ejara New")
    
    sc += c.change_manager(manager=new_manager.address).run(sender=spare)
    
    sc.h2('More Certifiers')
    
    cert4  = sp.test_account("Certfier 4")
    
    certifiers = {'CID4': cert4.address, 'C3ID': cert1.address}
    
    sc += c.update_certifiers(certifiers=certifiers).run(sender=new_manager)
    
    sc.h1('Run Invalid Tests')
    
    sc.h2('Update Certifiers Using Wrong Manager')
    
    certifiers = {
        'C1ID': cert1.address,
        'C2ID': cert2.address,
        'C3ID': cert3.address
    }
    
    sc += c.update_certifiers(certifiers=certifiers).run(sender=manager, valid=False)
    
    
    sc.h2('Add Item with unregistered certifier but correct id')
    
    cert5 = sp.test_account('Certifier 5')
    
    items = {
        "item4": {'name': 'item1 name hash', 'lot':'item1 lot hash'},
        "item5": {'name': 'item2 name hash', 'lot':'item2 lot hash'},
        "item6": {'name': 'item3 name hash', 'lot':'item3 lot hash'},
    }
    
    sc += c.add_items(id='C1ID', products=items).run(sender=cert5, valid=False)
    
    sc.h2('Add Item with unregistered certifier and incorrect id')
    
    sc += c.add_items(id='C5ID', products=items).run(sender=cert5, valid=False)
    
    sc.h2('Add Item with registered certifier and incorrect id')
    
    sc += c.add_items(id='C5ID', products=items).run(sender=cert1, valid=False)
    
    sc.h2('Register Lookup with wrong manager')
    
    sc += c.register_lookup(itemHash='item1').run(sender=manager, valid=False)
    
    sc.h2('Register Lookup with uncertified item')
    
    sc += c.register_lookup(itemHash='item12').run(sender=new_manager, valid=False)
    
    sc.h2('Showing variables...')
    
    sc.show(c.data.products['item1'], html=False)
    
    
    
@sp.add_test(name="Initialize for deployment")
def init_deploy():
    
    sc = sp.test_scenario()
    sc.register(SafeChain(sp.address('tz1gjb7vECNqrXrMAMDDpbf2AsxAGNen7LXn'), sp.address('tz1bP3uSKZ4caExVZRxAetZLtGg7tWWGVUra')))
    