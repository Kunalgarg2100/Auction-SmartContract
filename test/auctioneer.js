const Auctioneer = artifacts.require('./Auctioneer.sol')
const assert = require('assert')

let contractInstance

contract('Auctioneer',  (accounts) => {
	for(i=0;i<10;i++)
		console.log(i,accounts[i]);
	
	beforeEach(async () => {
		contractInstance = await Auctioneer.deployed()
	})

	it('Check if notary is getting registered', async() => {     
		var prevcnt = await contractInstance.getNotarycnt();
		await contractInstance.registerNotary({from: accounts[0]});
		var newcnt = await contractInstance.getNotarycnt();
		assert.equal(prevcnt.c[0] + 1, newcnt.c[0], 'Notary is not registered');
		await contractInstance.registerNotary({from: accounts[1]});
		await contractInstance.registerNotary({from: accounts[2]});
		await contractInstance.registerNotary({from: accounts[6]});
	})

	it('Check if bidder is getting registered', async() => {     
		var prevcnt = await contractInstance.getBiddercnt();
		await contractInstance.registerBidder([2,3],[18,18], 5, 15, {from: accounts[3], value: web3.toWei(0.000000000001,'ether')});
		var newcnt = await contractInstance.getBiddercnt();
		assert.equal(prevcnt.c[0] + 1, newcnt.c[0], 'Bidder is not registered');
		await contractInstance.registerBidder([2,3],[18,18], 5, 16, {from: accounts[4], value: web3.toWei(0.000000000002,'ether')});
		await contractInstance.registerBidder([2,3],[18,18], 5, 17, {from: accounts[5], value: web3.toWei(0.000000000003,'ether')});
		await contractInstance.registerBidder([4,5],[18,18], 5, 17, {from: accounts[7], value: web3.toWei(0.000000000001,'ether')});
		var finalcnt = await contractInstance.getBiddercnt();
		assert.equal(finalcnt.c[0], 4, 'Bidder is not registered');
	})   


	it('Check if two notaries with same address can get registered', async() => {
		var prevcnt = await contractInstance.getNotarycnt();
		try {
			await contractInstance.registerNotary({from: accounts[0]});
		}
		catch(err){
			console.log(err.message)
		}
		var newcnt = await contractInstance.getNotarycnt();
		assert.equal(prevcnt.c[0], newcnt.c[0], 'Bidder is not registered');
	})

	it('Check if two bidders with same address can get registered', async() => {
		var prevcnt = await contractInstance.getBiddercnt();
		try {
			await contractInstance.registerBidder([2,3],[18,18], 5, 18, {from: accounts[0]});
		}
		catch(err){
			console.log(err.message)
		}
		var newcnt = await contractInstance.getBiddercnt();
		assert.equal(prevcnt.c[0], newcnt.c[0], 'Bidder is registered but it should not be');
	})

	it('Check if Bidders items are valid',  async() => {
		var prevcnt = await contractInstance.getBiddercnt();
		try {
			await contractInstance.registerBidder([18,3],[18,18], 5, 18, {from: accounts[6]});
			assert.ok(false, 'The contract should throw an exception to \
					as the bidder items are not valid')
		}
		catch(err){
			console.log(err.message)
				assert.ok(true, 'The contract is throwing an error as the \
						bidder items are not valid')
		}
	})

	it('Check if Bidder gets added even when notary is not assigned to bidder',  async() => {
		/* Every notary is assigned before this test */
		try {
			await contractInstance.registerBidder([3,3],[18,18], 5, 18, {from: accounts[6]});
			assert.ok(false, 'The contract should throw an exception to \
					as the bidder items are not valid')
		}
		catch(err){
			console.log(err.message)
				assert.ok(true, 'The contract is throwing an error as the \
						bidder is not registered because notary was not available')
		}
	})

	it('Check if two bidders have been assigned same notary',  async() => {
		flag = true;
		temparray = []
			for(i = 3; i < 6; i++) {
				var x = await contractInstance.getAssignedNotary.call(accounts[i]);
				if(temparray.includes(x)){
					flag = false;
				}
				else{
					temparray.push(x)
				}
			}
		assert.equal(flag, true, 'Two Bidders have same Notary')
	})

	it('Check if the assigned notary of bidder is not bidder himself',  async() => {
		flag = true;
		for(i = 3; i < 6; i++) {
			var x = await contractInstance.getAssignedNotary.call(accounts[i]);
			if(x == accounts[i])
				flag = false;
		}
		assert.equal(flag, true, 'Bidder is Notary of himself')
	})

	it('Check compare 2 bidders', async() => {
		bid1 = await contractInstance.getBidderidx.call(accounts[3]);
		bid2 = await contractInstance.getBidderidx.call(accounts[4]);
		h = await contractInstance.compare.call(bid1.c[0],bid2.c[0]);
		assert.equal(h, false, 'Compare function not working properly');
		h = await contractInstance.compare.call(bid1.c[0],bid1.c[0]);
		assert.equal(h, true, 'Compare function not working properly');
	})

	it('Check sorting',  async() => {
		await contractInstance.auctioneer_sort();
		var w1 = new Array();
		var w2 = new Array();
		var val = new Array();
		var len = await contractInstance.getBiddercnt();
		var mod = await contractInstance.getmod();
		len=len.c[0];
		// console.log(mod.c[0]);
		// console.log(len);
		z=0;

		for(i=0;i<len;i++)
		{
			const z = i;
			w1[z] = await contractInstance.bid_val1(z);
			w2[z] = await contractInstance.bid_val2(z);
			// console.log(w1[z],w2[z]);
			val[z] = (w1[z].c[0]+w2[z].c[0])%(mod.c[0]); 
		}
		for(i=0;i<len-1;i++)
		{
			flag=false;
			// console.log(val[i]);
			if(val[i]>=val[i+1])
				flag=true;
			assert.equal(flag, true, 'Sorting doesn\'t work properly');
		}
	})

	it('Check intersection between 2 items', async() => {
		await contractInstance.compute_intersect();
		bid1 = await contractInstance.getBidderidx.call(accounts[3]);
		bid2 = await contractInstance.getBidderidx.call(accounts[4]);
		bid3 = await contractInstance.getBidderidx.call(accounts[7]);
		h = await contractInstance.do_intersect.call(bid1.c[0], bid2.c[0]);
		assert.equal(h, true, 'Intersection of 2 items sets is being computed wrong');
		h = await contractInstance.do_intersect.call(bid3.c[0], bid2.c[0]);
		assert.equal(h, false, 'Intersection of 2 items sets is being computed wrong');
	})

	it('Check square root function', async() => {
		s = await contractInstance.sqroot(9);
		r = await contractInstance.sqroot(25);
		t = await contractInstance.sqroot(36);
		//console.log(s, r, t);
		assert.equal(s, 3, 'Square root is wrong');
		assert.equal(r, 5, 'Square root is wrong');
		assert.equal(t, 6, 'Square root is wrong');
	})

	it('Check initial amount paid by bidder is correct', async() => {
		var flag = true;
		var ans = new Array()
		ans.push(1000000,2000000,3000000,1000000)
		for(i = 3; i < 6; i++) {
			var x = await contractInstance.getPendingReturn.call(accounts[i])
			console.log(x.c[0])
			if( x.c[0] != ans[i-3])
				flag = false;
		}
		var x = await contractInstance.getPendingReturn.call(accounts[7]);
		console.log(x.c[0])
		if( x.c[0] != ans[3])
				flag = false;
		assert.equal(flag, true, 'Initial amount paid by bidder is not correct');
	})


	it('Check winners', async() => {
		function timepass(){
			for(i=0;i<2000000000;i++);
			
		}
		await timepass();

		await contractInstance.find_winners()
		var ans = new Array();

		ans.push(accounts[5],accounts[7]);
		var len = await contractInstance.getWinnerscnt();
		len=len.c[0];
		var flag=true;
		for(i=0;i<len;i++)
		{
			const z=i;
			var p = await contractInstance.getWinners.call(z);
			var q = await contractInstance.getBidderadd(p);
			if(ans.includes(q))
			{
				var idx = ans.indexOf(q);
				if(idx!=-1)
					ans.splice(idx,1);
			}
			else
				flag = false;
		}
		assert.equal(flag,true,'error in find_winners function');
	})

	it('Check Amount paid to winners is correct', async() => {
		var flag = true;
		var ans = new Array()
		ans.push(1000000,2000000,2999997,999997)
		for(i = 3; i < 6; i++) {
			var x = await contractInstance.getPendingReturn.call(accounts[i]);
			console.log(x.c[0])
			if( x.c[0] != ans[i-3])
				flag = false;
		}
		var x = await contractInstance.getPendingReturn.call(accounts[7]);
		console.log(x.c[0])
		if( x.c[0] != ans[3])
				flag = false;
		assert.equal(flag, true, 'Final amount paid to bidder is not correct');
	})
})
