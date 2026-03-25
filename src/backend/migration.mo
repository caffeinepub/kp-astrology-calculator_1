import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  public type UserProfile = {
    name : Text;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    charts : Map.Map<Principal, Text>;
  };

  public func run(_old : {}) : NewActor {
    {
      userProfiles = Map.empty<Principal, UserProfile>();
      charts = Map.empty<Principal, Text>();
    };
  };
};
