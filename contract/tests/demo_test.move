#[test_only]
module contract::demo_tests;

use contract::admin::{Self, AdminList};
use contract::demo::{Self, DemoPool, Cap, Demo};
use contract::profile::{Self, State, Profile};
use std::debug;
use std::string;
use sui::test_scenario;
use sui::test_utils::assert_eq;

const USER: address = @0x123;
const VISITOR: address = @0x456;

#[test]
fun test_create_demo() {
    c

    // 初始化
    {
        demo::init_testing(test_scenario::ctx(scenario));
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

    // 第二个交易：创建demo
    test_scenario::next_tx(scenario, USER);
    {
        let mut pool = test_scenario::take_shared<DemoPool>(scenario);
        let mut profile = test_scenario::take_from_address<Profile>(scenario, USER);
        let name = string::utf8(b"test_demo");
        let des = string::utf8(b"test_demo_description");
        demo::create_demo_entry(name, des, &mut pool, &mut profile, test_scenario::ctx(scenario));
        test_scenario::return_shared(pool);
        test_scenario::return_to_sender(scenario, profile);
    };

    // 第3个交易：验证事件
    let tx = test_scenario::next_tx(scenario, USER);
    assert_eq(test_scenario::num_user_events(&tx), 1);

    // 结束测试场景
    test_scenario::end(scenario_val);
}

#[test]
fun test_AddAndRemove_visitor_by_user() {
    let mut scenario_val = test_scenario::begin(USER);
    let scenario = &mut scenario_val;

    // 初始化
    {
        demo::init_testing(test_scenario::ctx(scenario));
        profile::init_testing(test_scenario::ctx(scenario));
        admin::init_testing(test_scenario::ctx(scenario));
    };

    // 第一个交易：创建profile
    test_scenario::next_tx(scenario, USER);
    {
        let mut state = test_scenario::take_shared<State>(scenario);
        let name = string::utf8(b"test_user");
        profile::create_profile(name, &mut state, test_scenario::ctx(scenario));
        test_scenario::return_shared(state);
    };

    // 第二个交易：创建demo
    test_scenario::next_tx(scenario, USER);
    {
        let mut pool = test_scenario::take_shared<DemoPool>(scenario);
        let mut profile = test_scenario::take_from_address<Profile>(scenario, USER);
        let name = string::utf8(b"test_demo");
        let des = string::utf8(b"test_demo_description");
        demo::create_demo_entry(name, des, &mut pool, &mut profile, test_scenario::ctx(scenario));
        test_scenario::return_shared(pool);
        test_scenario::return_to_sender(scenario, profile);
    };

    // 第3个交易：添加访客
    test_scenario::next_tx(scenario, USER);
    {
        let cap = test_scenario::take_from_sender<Cap>(scenario);
        let mut demo = test_scenario::take_shared<Demo>(scenario);
        demo::add_visitor_by_user(&mut demo, &cap, VISITOR);
        test_scenario::return_shared(demo);
        test_scenario::return_to_sender(scenario, cap);
    };

    //验证是否添加访客成功
    test_scenario::next_tx(scenario, USER);
    {
        let demo = test_scenario::take_shared<Demo>(scenario);
        let adminlist = test_scenario::take_shared<AdminList>(scenario);
        let reslut = demo::approve_internal(VISITOR, &demo, &adminlist);
        debug::print(&reslut);
        test_scenario::return_shared(demo);
        test_scenario::return_shared(adminlist);
    };

    // 第4个交易：删除访客
    test_scenario::next_tx(scenario, USER);
    {
        let cap = test_scenario::take_from_sender<Cap>(scenario);
        let mut demo = test_scenario::take_shared<Demo>(scenario);
        demo::remove_visitor_by_user(&mut demo, &cap, VISITOR);
        test_scenario::return_shared(demo);
        test_scenario::return_to_sender(scenario, cap);
    };
    //验证是否删除访客成功
    test_scenario::next_tx(scenario, VISITOR);
    test_scenario::next_tx(scenario, USER);
    {
        let demo = test_scenario::take_shared<Demo>(scenario);
        let adminlist = test_scenario::take_shared<AdminList>(scenario);
        let reslut = demo::approve_internal(VISITOR, &demo, &adminlist);
        debug::print(&reslut);
        test_scenario::return_shared(demo);
        test_scenario::return_shared(adminlist);
    };
    // 结束测试场景
    test_scenario::end(scenario_val);
}

#[test]
fun test_isnot_visitor() {
    let mut scenario_val = test_scenario::begin(USER);
    let scenario = &mut scenario_val;

    // 初始化
    {
        demo::init_testing(test_scenario::ctx(scenario));
        profile::init_testing(test_scenario::ctx(scenario));
        admin::init_testing(test_scenario::ctx(scenario));
    };

    // 第一个交易：创建profile
    test_scenario::next_tx(scenario, USER);
    {
        let mut state = test_scenario::take_shared<State>(scenario);
        let name = string::utf8(b"test_user");
        profile::create_profile(name, &mut state, test_scenario::ctx(scenario));
        test_scenario::return_shared(state);
    };

    // 第二个交易：创建demo
    test_scenario::next_tx(scenario, USER);
    {
        let mut pool = test_scenario::take_shared<DemoPool>(scenario);
        let mut profile = test_scenario::take_from_address<Profile>(scenario, USER);
        let name = string::utf8(b"test_demo");
        let des = string::utf8(b"test_demo_description");
        demo::create_demo_entry(name, des, &mut pool, &mut profile, test_scenario::ctx(scenario));
        test_scenario::return_shared(pool);
        test_scenario::return_to_sender(scenario, profile);
    };

    // 第3个交易：添加访客
    test_scenario::next_tx(scenario, VISITOR);
    test_scenario::next_tx(scenario, USER);
    {
        let demo = test_scenario::take_shared<Demo>(scenario);
        let adminlist = test_scenario::take_shared<AdminList>(scenario);
        let result = demo::approve_internal(VISITOR, &demo, &adminlist);
        debug::print(&result);
        test_scenario::return_shared(demo);
        test_scenario::return_shared(adminlist);
    };
    // 结束测试场景
    test_scenario::end(scenario_val);
}

#[test]
fun test_request_demo() {
    let mut scenario_val = test_scenario::begin(USER);
    let scenario = &mut scenario_val;

    // 初始化
    {
        demo::init_testing(test_scenario::ctx(scenario));
        profile::init_testing(test_scenario::ctx(scenario));
        admin::init_testing(test_scenario::ctx(scenario));
    };

    // 第一个交易：创建profile
    test_scenario::next_tx(scenario, USER);
    {
        let mut state = test_scenario::take_shared<State>(scenario);
        let name = string::utf8(b"test_user");
        profile::create_profile(name, &mut state, test_scenario::ctx(scenario));
        test_scenario::return_shared(state);
    };
    // 验证事件
    let tx1 = test_scenario::next_tx(scenario, USER);
    assert_eq(test_scenario::num_user_events(&tx1), 1);

    // 第二个交易：创建demo
    test_scenario::next_tx(scenario, USER);
    {
        let mut pool = test_scenario::take_shared<DemoPool>(scenario);
        let mut profile = test_scenario::take_from_address<Profile>(scenario, USER);
        let name = string::utf8(b"test_demo");
        let des = string::utf8(b"test_demo_description");
        demo::create_demo_entry(name, des, &mut pool, &mut profile, test_scenario::ctx(scenario));
        test_scenario::return_shared(pool);
        test_scenario::return_to_sender(scenario, profile);
    };
    // 验证事件
    let tx2 = test_scenario::next_tx(scenario, USER);
    assert_eq(test_scenario::num_user_events(&tx2), 1);

    // 第3个交易：请求访问
    test_scenario::next_tx(scenario, VISITOR);
    {
        let mut demo = test_scenario::take_shared<Demo>(scenario);
        let des = string::utf8(b"I'm interested in this demo");
        demo::request_demo(&mut demo, des, test_scenario::ctx(scenario));
        test_scenario::return_shared(demo);
    };

    test_scenario::next_tx(scenario, USER);
    {
        let demo = test_scenario::take_shared<Demo>(scenario);
        let adminlist = test_scenario::take_shared<AdminList>(scenario);
        let result = demo::approve_internal(VISITOR, &demo, &adminlist);
        debug::print(&result);
        test_scenario::return_shared(demo);
        test_scenario::return_shared(adminlist);
    };

    // 结束测试场景
    test_scenario::end(scenario_val);
}
