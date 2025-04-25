// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0


module contract::allowlist;

use std::string::String;
use sui::dynamic_field as df;
use contract::utils::is_prefix;
use sui::table::{Self,Table};
use sui::event::emit;
use std::address;

//=====Error Codes=====
const EInvalidCap: u64 = 0;
const ENoAccess: u64 = 1;
const EDuplicate: u64 = 2;
const MARKER: u64 = 3;
const ERROR_PROFILE_EXISTS :u64 = 4;


//=====Structs=====
public struct Demo has key {
    id: UID,
    name: String,
    des: String,
    list: vector<address>,
}

public struct Cap has key {
    id: UID,
    demo_id: ID,
}

public struct DemoPool has key {
    id: UID,
    demos: Table<ID,address>
}

//=====Events=====
public struct DemoCreated has copy,drop {
    id: ID,
    name: String,
    des: String,
    owner: address
}


//=====Functions=====
fun init(ctx: &mut TxContext) {
    let pool = DemoPool {
        id: object::new(ctx),
        demos: table::new(ctx),
    };
    transfer::share_object(pool);
}

public fun create_allowlist(name: String,des:String, pool:&mut DemoPool, ctx: &mut TxContext): Cap {
    let owner = ctx.sender();
    let demo = Demo {
        id: object::new(ctx),
        list: vector::empty(),
        name: name,
        des: des,
    };

    let cap = Cap {
        id: object::new(ctx),
        demo_id: object::id(&demo),
    };

    let demo_id = demo.id.to_inner();
    assert!(!table::contains(&pool.demos, demo_id), ERROR_PROFILE_EXISTS);
    table::add(&mut pool.demos, demo_id, owner);

    emit(DemoCreated {
        id: demo.id.to_inner(),
        name: demo.name,
        des: demo.des,
        owner: owner,
    });
    
    transfer::share_object(demo);
    cap
}

entry fun create_allowlist_entry(name: String, des: String,pool:&mut DemoPool,ctx: &mut TxContext) {
    transfer::transfer(create_allowlist(name,des,pool, ctx), ctx.sender());
}

public fun add(demo: &mut Demo, cap: &Cap, account: address) {
    assert!(cap.demo_id == object::id(demo), EInvalidCap);
    assert!(!demo.list.contains(&account), EDuplicate);
    demo.list.push_back(account);
}

public fun remove(allowlist: &mut Demo, cap: &Cap, account: address) {
    assert!(cap.demo_id == object::id(allowlist), EInvalidCap);
    allowlist.list = allowlist.list.filter!(|x| x != account);
}



public fun namespace(demo: &Demo): vector<u8> {
    demo.id.to_bytes()
}

fun approve_internal(caller: address, id: vector<u8>, allowlist: &Demo): bool {
    let namespace = namespace(allowlist);
    if (!is_prefix(namespace, id)) {
        return false
    };

    allowlist.list.contains(&caller)
}

entry fun seal_approve(id: vector<u8>, allowlist: &Demo, ctx: &TxContext) {
    assert!(approve_internal(ctx.sender(), id, allowlist), ENoAccess);
}

public fun publish(allowlist: &mut Demo, cap: &Cap, blob_id: String) {
    assert!(cap.demo_id == object::id(allowlist), EInvalidCap);
    df::add(&mut allowlist.id, blob_id, MARKER);
}

#[test_only]
public fun new_allowlist_for_testing(ctx: &mut TxContext): Demo {
    use std::string::utf8;

    Demo {
        id: object::new(ctx),
        name: utf8(b"test"),
        des: utf8(b"this is a test"),
        list: vector::empty(),
    }
}

#[test_only]
public fun new_cap_for_testing(ctx: &mut TxContext, demo: &Demo): Cap {
    Cap {
        id: object::new(ctx),
        demo_id: object::id(demo),
    }
}

#[test_only]
public fun destroy_for_testing(demo: Demo, cap: Cap) {
    let Demo { id, .. } = demo;
    object::delete(id);
    let Cap { id, .. } = cap;
    object::delete(id);
}
