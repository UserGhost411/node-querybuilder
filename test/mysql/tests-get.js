var should = require('chai').should();
var expect = require('chai').expect;
var qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

describe('get()', function() {
	it('should exist', function() {
		should.exist(qb.get);
	});
	it('should be a function', function() {
		qb.get.should.be.a('function');
	});
	it('should add a table to from_array when a table is supplied', function() {
		qb.reset_query();
		qb.get('galaxies');
		qb.from_array.should.eql(['`galaxies`']);
	});
	it('should add a set of tables to from_array when an array of tables is supplied', function() {
		qb.reset_query();
		qb.get(['galaxies','star_systems','planets']);
		qb.from_array.should.eql(['`galaxies`','`star_systems`','`planets`']);
	});
	it('should return a string', function() {
		qb.reset_query();
		var sql = qb.get('galaxies');
		expect(sql).to.be.a('string');
		expect(sql).to.exist;
		expect(sql).to.not.eql('');
	});
	it('should build a properly-escaped SELECT statement that retrieves all records in a table if only a table is given', function() {
		qb.reset_query();
		var sql = qb.get('galaxies');
		sql.should.eql('SELECT * FROM (`galaxies`)');
	});
	it('should properly handle alias if provided in table string', function() {
		qb.reset_query();
		var sql = qb.get('galaxies g');
		sql.should.eql('SELECT * FROM (`galaxies` `g`)');
	});
	it('should build a properly-escaped SELECT statement that retrieves all fields specified from a table', function() {
		qb.reset_query();
		var sql = qb.select(['id','name']).get('galaxies');
		sql.should.eql("SELECT `id`, `name` FROM (`galaxies`)");
	});
	it('should build a properly-escaped SELECT statement that retrieves all records in a table that match passed conditions', function() {
		qb.reset_query();
		var sql = qb.where('class','M').get('galaxies');
		sql.should.eql("SELECT * FROM (`galaxies`) WHERE `class` = 'M'");
	});
	it('should build a properly-escaped SELECT statement that retrieves all records from a set of joined tables if an array of tables is given', function() {
		qb.reset_query();
		var sql = qb.get(['galaxies','star_systems','planets']);
		sql.should.eql('SELECT * FROM (`galaxies`, `star_systems`, `planets`)');
	});
	it('should build a properly-escaped SELECT statement that retrieves all records in a set of tables that match the passed conditions', function() {
		qb.reset_query();
		var sql = qb.where('class', 'M').get(['galaxies','star_systems','planets']);
		sql.should.eql("SELECT * FROM (`galaxies`, `star_systems`, `planets`) WHERE `class` = 'M'");
	});
	it('should use tables added previously via the from() method', function() {
		qb.reset_query();
		qb.from('galaxies');
		var sql = qb.get();
		sql.should.eql('SELECT * FROM (`galaxies`)');
		
		qb.reset_query();
		var sql = qb.from(['galaxies','star_systems','planets']).get();
		sql.should.eql('SELECT * FROM (`galaxies`, `star_systems`, `planets`)');
	});
	it('should accept where conditions added previously via the where() method', function() {
		qb.reset_query();
		var sql = qb.where('created >=',4.6E9).where({classification: 'M'}).get('galaxies');
		sql.should.eql("SELECT * FROM (`galaxies`) WHERE `created` >= 4600000000 AND `classification` = 'M'");
	});
	it('should accept a limit on the number of rows selected', function() {
		qb.reset_query();
		var sql = qb.limit(20).get('galaxies');
		sql.should.eql("SELECT * FROM (`galaxies`) LIMIT 20");
	});
	it('should accept a LIMIT on the number of rows to select and an OFFSET at which to start selecting the rows', function() {
		qb.reset_query();
		var sql = qb.limit(20,10).get('galaxies');
		sql.should.eql("SELECT * FROM (`galaxies`) LIMIT 10, 20");
	});
	it('should include the DISTINCT keyword if the distinct() method is called', function() {
		qb.reset_query();
		var sql = qb.distinct().select(['id','name']).get('galaxies');
		sql.should.eql("SELECT DISTINCT `id`, `name` FROM (`galaxies`)");
	});
	it('should include the MIN, MAX, AVG, or SUM aggregation methods in the select statement if provided', function() {
		qb.reset_query();
		
		// MIN
		var sql = qb.select_min('size','min_size').get('galaxies');
		sql.should.eql("SELECT MIN(`size`) AS min_size FROM (`galaxies`)");
		qb.reset_query();
		
		// MAX
		var sql = qb.select_max('size','max_size').get('galaxies');
		sql.should.eql("SELECT MAX(`size`) AS max_size FROM (`galaxies`)");
		qb.reset_query();
		
		// AVG
		var sql = qb.select_avg('size','avg_size').get('galaxies');
		sql.should.eql("SELECT AVG(`size`) AS avg_size FROM (`galaxies`)");
		qb.reset_query();
		
		// SUM
		var sql = qb.select_sum('size','total_size').get('galaxies');
		sql.should.eql("SELECT SUM(`size`) AS total_size FROM (`galaxies`)");
	});
	it('should include any joins that were added in the chain', function() {
		qb.reset_query();
		var sql = qb.select(['s.name as star_system_name', 'g.name as galaxy_name'])
			.join('galaxies g','g.id=s.galaxy_id','left')
			.get('star_systems s');
		sql.should.eql("SELECT `s`.`name` as `star_system_name`, `g`.`name` as `galaxy_name` FROM (`star_systems` `s`) LEFT JOIN `galaxies` `g` ON `g`.`id`=`s`.`galaxy_id`");
	});
	it('should include any GROUP BY statements added using the group_by() method.', function() {
		qb.reset_query();
		var sql = qb.select('size').select('COUNT(id) as `num_of_size`',false).group_by('size').get('galaxies');
		sql.should.eql("SELECT `size`, COUNT(id) AS `num_of_size` FROM (`galaxies`) GROUP BY `size`"); 
	});
	it('should add the ORDER BY clause of the order_by() method was called in the chain', function() {
		qb.reset_query();
		var sql = qb.order_by('size').get('galaxies');
		sql.should.eql("SELECT * FROM (`galaxies`) ORDER BY `size` ASC");
	});
	it('should include any HAVING clauses added using the having() method', function() {
		qb.reset_query();
		var sql = qb.select('size').select('COUNT(id) as `num_of_size`',false).group_by('size').having('num_of_size >=',456034960).get('galaxies');
		sql.should.eql("SELECT `size`, COUNT(id) AS `num_of_size` FROM (`galaxies`) GROUP BY `size` HAVING `num_of_size` >= 456034960"); 
	});
});