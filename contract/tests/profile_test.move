#[test_only]
 module contract::profile_tests;
 use sui::test_scenario::{Self};
 use contract::profile::{Self,State};
 use contract::demo::{Self,DemoPool};
 use sui::test_utils::assert_eq;
 use contract::profile::Profile;
 use std::string;

const USER :address  = @0x123;

#[test]
fun test_create_proflie(){
    
    let mut scenario_val = test_scenario::begin(USER);
    let scenario = &mut scenario_val;
    
    // 初始化
    {
        profile::init_testing(test_scenario::ctx(scenario));
    };

    // 第一个交易：创建profile
    test_scenario::next_tx(scenario, USER);
    {
        let mut state = test_scenario::take_shared<State>(scenario);
        let name = string::utf8(b"test_user");
        profile::create_profile(name, &mut state, test_scenario::ctx(scenario));
        test_scenario::return_shared(state);
    };

    // 第二个交易：验证事件
    let tx = test_scenario::next_tx(scenario, USER);
    assert_eq(test_scenario::num_user_events(&tx), 1);
    
    // 结束测试场景
    test_scenario::end(scenario_val);
}

#[test]
fun test_add_demo_to_profile(){
    let mut scenario_val = test_scenario::begin(USER);
    let scenario = &mut scenario_val;
    
    // 初始化
    profile::init_testing(test_scenario::ctx(scenario));
    demo::init_testing(test_scenario::ctx(scenario));
    // 第一个交易：创建profile
    test_scenario::next_tx(scenario, USER);
    {
        let mut state = test_scenario::take_shared<State>(scenario);
        let name = string::utf8(b"test_user");
        profile::create_profile(name, &mut state, test_scenario::ctx(scenario));
        test_scenario::return_shared(state);
    };

    // 第二个交易：添加demo到profile
    test_scenario::next_tx(scenario, USER);
    {

        let mut profile = test_scenario::take_from_sender<Profile>(scenario);
        let demo  = @0x123; 
        let demo_id  = demo.to_id();
        profile::add_demo_to_profile(&mut profile, demo_id, test_scenario::ctx(scenario));       
        test_scenario::return_to_sender(scenario,profile);
    };

    // 第三个交易：验证事件
    let tx = test_scenario::next_tx(scenario, USER);
    assert_eq(test_scenario::num_user_events(&tx), 0);

    // 结束测试场景
    test_scenario::end(scenario_val);
}