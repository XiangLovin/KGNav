import os
import requests
import time
from flask import Flask, request, jsonify



app = Flask(__name__)

@app.route('/get_data',methods=['GET'])
def path_generate():

	# keyword-related entities
	entities = []
	search = request.args.get('search')
	params_entities = {
		'action': 'wbsearchentities',
		'format': 'json',
		'language': 'en',
		'uselang': 'en',
		'type': 'item',
		'continue': '0',
		'limit': '20',
		'search': search
		}
	entities_info = requests.post('https://www.wikidata.org/w/api.php', params=params_entities).json()['search']
	'''
	for entity in entities_info:
		entity_id = entity['id']
		# description exist
		if 'description' in entity['display'].keys():
			entity_name = entity['display']['label']['value'] + '(' + entity['display']['description']['value'] + ')'
		# otherwise
		else:
			entity_name = entity['display']['label']['value']
		entities.append((entity_id, entity_name))
	'''


	# entity-related subgraph
	entity_id = entities_info[0]['id']
	if 'description' in entities_info[0]['display'].keys():
		entity_name = entities_info[0]['display']['label']['value'] + '(' + entities_info[0]['display']['description']['value'] + ')'
	else:
		entity_name = entities_info[0]['display']['label']['value']	
	# entity_id = 'Q110037418'
	params_subgraph = {
		'origin': '*',
		'format': 'json',
		'query': 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
				 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' +
				 'PREFIX owl: <http://www.w3.org/2002/07/owl#>\n' +
				 'PREFIX bd: <http://www.bigdata.com/rdf#>\n' +
				 'PREFIX wikibase: <http://wikiba.se/ontology#>\n' +
				 'SELECT DISTINCT ?property ?propertyLabel ?kind WHERE {\n' +
				 '  <http://www.wikidata.org/entity/' + entity_id + '> ?property [] .\n' +
				 '  ?p wikibase:directClaim ?property .\n' +
				 '  OPTIONAL { ?p rdfs:label ?propertyLabel . FILTER (lang(?propertyLabel) = "en")}\n' +
				 '  BIND(\n' +
				 '    IF(EXISTS { ?property rdf:type owl:ObjectProperty},\n' +
				 '      1,\n' +
				 '      IF(EXISTS {?property rdf:type owl:DatatypeProperty},\n' +
				 '        2,\n' +
				 '        0))\n' +
				 '    as ?kind)\n' +
				 '}\n'
		}
	subgraph = requests.post('https://query.wikidata.org/sparql', params=params_subgraph)
	


	# subgraph info
	relations = []
	properties = []
	count = 0
	for value in subgraph.json()['results']['bindings']:
		time.sleep(0.4)
		if count <= 10:
			# object properties
			if value['kind']['value'] == '1':
				relation_name = value['propertyLabel']['value']
				relation_id = value['property']['value'].split('/')[-1]

				params_relation = {
					'origin': '*',
					'format': 'json',
					'query': 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
							 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' +
							 'SELECT DISTINCT ?uri ?uriLabel WHERE {\n' +
							 '  <http://www.wikidata.org/entity/' + entity_id + '> <http://www.wikidata.org/prop/direct/' + relation_id + '> ?uri .\n' +
							 '  OPTIONAL { ?uri rdfs:label ?uriLabel . FILTER (lang(?uriLabel) = "en")}\n' +
							 '}'
					}
				try:
					rear_entity = requests.post('https://query.wikidata.org/sparql', params=params_relation).json()['results']['bindings'][0]
				except:
					print(requests.post('https', params=params_relation).content)
					continue
				# judge picture
				if 'http://commons.wikimedia.org/' in rear_entity['uri']['value']:
					continue
				else:
					rear_entity_id = rear_entity['uri']['value'].split('/')[-1]
					print(rear_entity_id)
					try:
						rear_entity_name = rear_entity['uriLabel']['value']
						print(rear_entity_name)
						relations.append((relation_name, rear_entity_id, rear_entity_name))
					except:
						print(rear_entity)
					print()

			# datatype properties
			if value['kind']['value'] == '2':
				property_name = value['propertyLabel']['value']
				property_id = value['property']['value'].split('/')[-1]

				params_property = {
					'origin': '*',
					'format': 'json',
					'query': 'SELECT DISTINCT ?lit WHERE {\n' +
							 '  <http://www.wikidata.org/entity/' + entity_id + '> <http://www.wikidata.org/prop/direct/' + property_id + '> ?lit .\n' +
							 '  FILTER (lang(?lit) = "" || lang(?lit) = "en")\n' +
							 '}'
					}
				
				property_value = requests.post('https://query.wikidata.org/sparql', params=params_property).json()['results']['bindings'][0]['lit']['value']

				properties.append((property_name, property_value))
		# count += 1


	# convert format
	data = {'nodes': [], 'edges': []}
	for relation in relations:
		node = {'id': relation[1], 'value': relation[2], 'url': 'http://www.wikidata.org/entity/'+relation[1]}
		data['nodes'].append(node)
		edge = {'source': entity_id, 'target': relation[1], 'value': relation[0]}
		data['edges'].append(edge)

	return jsonify(data)

	




if __name__ == '__main__':
    port = int(os.environ.get('PORT', 9000))
    app.run(host='0.0.0.0', port=port)