// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const config = require('./config');

let collection;
let usersCollection;

// [START translate]
function fromMongo(item) {
	if (Array.isArray(item) && item.length) {
		item = item[0];
	}
	item.id = item._id;
	delete item._id;
	return item;
}

function toMongo(item) {
	delete item.id;
	return item;
}
// [END translate]

function getCollection(cb) {
	if (collection) {
		setImmediate(() => {
			cb(null, collection);
		});
		return;
	}
	if (usersCollection) {
		setImmediate(() => {
			cb(null, usersCollection);
		});
		return;
	}
	MongoClient.connect(config.get('EgyptMONGODB_URI'), (err, db) => {
		if (err) {
			cb(err);
			return;
		}
		collection = db.collection('travelwarnings');
		cb(null, collection);
	});
}

function getUsersCollection(cb) {

	if (usersCollection) {
		setImmediate(() => {
			cb(null, usersCollection);
		});
		return;
	}
	MongoClient.connect(config.get('EgyptMONGODB_URI'), (err, db) => {
		if (err) {
			cb(err);
			return;
		}
		usersCollection = db.collection('users');
		cb(null, usersCollection);
	});
}

// [START list]
function list(limit, cb) {

	getCollection((err, collection) => {
		if (err) {
			cb(err);
			return;
		}
		collection.find({})
			.limit(limit)
			.sort({
				'date': -1
			})
			.toArray((err, results) => {
				if (err) {
					cb(err);
					return;
				}
				cb(null, results.map(fromMongo));
			});
		
	});
}
// [END list]

// [START create]
function createUser(data, cb) {
	getUsersCollection((err, collection) => {
		if (err) {
			cb(err);
			return;
		}
		collection.findAndModify({user: user}, {}, {$set: {user: user}}, {upsert: true, new: true}, cb);
		/*
		collection.insert(data, {
			w: 1
		}, (err, result) => {
			if (err) {
				cb(err);
				return;
			}
			const item = fromMongo(result.ops);
			cb(null, item);
		});
		*/
	});
}
// [END create]
module.exports = {
	list,
	createUser
};
