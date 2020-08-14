exports.code = `parameter (or (address %change_manager) (string %set_merkle_hash));
storage   (pair (address %manager) (pair (string %merkle_hash) (address %spare)));
code
  {
    DUP;        # pair @parameter @storage : pair @parameter @storage
    CDR;        # @storage : pair @parameter @storage
    SWAP;       # pair @parameter @storage : @storage
    CAR;        # @parameter : @storage
    IF_LEFT
      {
        # Entry point: change_manager # @parameter%change_manager : @storage
        # sp.verify(sp.pack(sp.sender) == sp.pack(self.data.spare), message = 'Unauthorized account. Only spare can peform this action.') # @parameter%change_manager : @storage
        SWAP;       # @storage : @parameter%change_manager
        DUP;        # @storage : @storage : @parameter%change_manager
        DUG 2;      # @storage : @parameter%change_manager : @storage
        CDDR;       # address : @parameter%change_manager : @storage
        PACK;       # bytes : @parameter%change_manager : @storage
        SENDER;     # address : bytes : @parameter%change_manager : @storage
        PACK;       # bytes : bytes : @parameter%change_manager : @storage
        COMPARE;    # int : @parameter%change_manager : @storage
        EQ;         # bool : @parameter%change_manager : @storage
        IF
          {}
          {
            PUSH string "Unauthorized account. Only spare can peform this action."; # string : @parameter%change_manager : @storage
            FAILWITH;   # FAILED
          }; # @parameter%change_manager : @storage
        # self.data.manager = params.manager # @parameter%change_manager : @storage
        SWAP;       # @storage : @parameter%change_manager
        CDR;        # pair (string %merkle_hash) (address %spare) : @parameter%change_manager
        SWAP;       # @parameter%change_manager : pair (string %merkle_hash) (address %spare)
        PAIR;       # pair @parameter%change_manager (pair (string %merkle_hash) (address %spare))
      }
      {
        # Entry point: set_merkle_hash # @parameter%set_merkle_hash : @storage
        # sp.verify(sp.pack(sp.sender) == sp.pack(self.data.manager), message = 'Unauthorized account. Only manager can peform this action.') # @parameter%set_merkle_hash : @storage
        SWAP;       # @storage : @parameter%set_merkle_hash
        DUP;        # @storage : @storage : @parameter%set_merkle_hash
        DUG 2;      # @storage : @parameter%set_merkle_hash : @storage
        CAR;        # address : @parameter%set_merkle_hash : @storage
        PACK;       # bytes : @parameter%set_merkle_hash : @storage
        SENDER;     # address : bytes : @parameter%set_merkle_hash : @storage
        PACK;       # bytes : bytes : @parameter%set_merkle_hash : @storage
        COMPARE;    # int : @parameter%set_merkle_hash : @storage
        EQ;         # bool : @parameter%set_merkle_hash : @storage
        IF
          {}
          {
            PUSH string "Unauthorized account. Only manager can peform this action."; # string : @parameter%set_merkle_hash : @storage
            FAILWITH;   # FAILED
          }; # @parameter%set_merkle_hash : @storage
        # self.data.merkle_hash = params.merkle_hash # @parameter%set_merkle_hash : @storage
        SWAP;       # @storage : @parameter%set_merkle_hash
        DUP;        # @storage : @storage : @parameter%set_merkle_hash
        CAR;        # address : @storage : @parameter%set_merkle_hash
        SWAP;       # @storage : address : @parameter%set_merkle_hash
        CDDR;       # address : address : @parameter%set_merkle_hash
        DIG 2;      # @parameter%set_merkle_hash : address : address
        PAIR;       # pair @parameter%set_merkle_hash address : address
        SWAP;       # address : pair @parameter%set_merkle_hash address
        PAIR;       # pair address (pair @parameter%set_merkle_hash address)
      }; # pair @parameter%change_manager (pair (string %merkle_hash) (address %spare))
    NIL operation; # list operation : pair @parameter%change_manager (pair (string %merkle_hash) (address %spare))
    PAIR;       # pair (list operation) (pair @parameter%change_manager (pair (string %merkle_hash) (address %spare)))
  } # pair (list operation) (pair @parameter%change_manager (pair (string %merkle_hash) (address %spare)));`;

exports.storage = {
    merkle_hash: "",
    manager: "tz1N9D1BLfhWFxKu3g5Y47arcJHQGJauCxqb",
    spare: "tz1UprVhwoHVrKodvFKcBBvqvsMiNB8HUyGC"
};

exports.key = "edskRyViHXHZvdSiqFTbbiTV5Sf5p1nbCu2wxS5wUELVCVf6VGb2dhV51wnoehA6pYo5JW2pTi835hvDcQrA56cJNPhCJJjv8G";
