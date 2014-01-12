jQuery(window).ready(function () {
	
	var gantt = JSGanttChart.create({
		"resources": {
			"programmer": "Peter West",
			"supervisor": "mc",
			"cosupervisor": "max"
		},
		"types": {
			"analysis": {
				"name": "Analysis",
				"color": "#C79810"  // yellow
			},
			"critical": {
				"name": "Critical",
				"color": "#CC0000" // red
			},
			"programming": {
				"name": "Programming",
				"color": "#356AA0" // blue
			},
			"documentation": {
				"name": "Documentation",
				"color": "#FF7400" // orange
			}
		},
		"elements": [
			{
				"order": 0,
				"name": "Supervisor meeting",
				"startDate": "2011-10-01T10:00:00.000Z",
				"id": "meeting1",
				"percentageDone": 100,
				"resources": [
					"programmer",
					"supervisor",
					"cosupervisor"
				],
				"endDate": "2011-10-02T10:00:00.000Z",
				"type": "",
				"hoursExpected": null,
				"predecessors": [],
				"description": "",
				"icons": [],
				"parentElement": ""
			},
			{
				"order": 1,
				"name": "Project Brief",
				"startDate": "2011-10-02T23:00:00.000Z",
				"id": "brief",
				"predecessors": [
					"meeting1"
				],
				"endDate": "2011-10-14T15:00:00.000Z",
				"type": "critical",
				"slackEndDate": "2011-10-21T15:00:00.000Z",
				"percentageDone": 95,
				"estimatedHours": 10,
				"hoursExpected": null,
				"resources": [],
				"icons": [
					{
						"type": "deadline",
						"date": "2011-10-14T00:00:00.000Z",
						"description": "Handin"
					}
				],
				"description": "",
				"parentElement": " "
			},
			{
				"order": 0,
				"name": "Draft 1",
				"startDate": "2011-10-02T23:00:00.000Z",
				"id": "briefdraft1",
				"endDate": "2011-10-14T15:00:00.000Z",
				"type": "analysis",
				"percentageDone": 100,
				"estimatedHours": 5,
				"parentElement": "brief",
				"icons": [],
				"description": "",
				"hoursExpected": null,
				"resources": [],
				"predecessors": []
			},
			{
				"order": 2,
				"name": "Draft 2",
				"startDate": "2011-10-14T23:00:00.000Z",
				"id": "briefdraft2",
				"predecessors": [
					"briefdraft1"
				],
				"endDate": "2011-10-16T23:00:00.000Z",
				"percentageDone": 90,
				"estimatedHours": 5,
				"parentElement": "brief",
				"type": "",
				"hoursExpected": null,
				"resources": [],
				"icons": [],
				"description": ""
			},
			{
				"order": 2,
				"name": "Project Planning",
				"startDate": "2011-10-16T23:00:00.000Z",
				"id": "planning",
				"predecessors": [
					"brief"
				],
				"endDate": "2011-10-30T14:00:00.000Z",
				"percentageDone": 50,
				"type": "",
				"hoursExpected": null,
				"resources": [],
				"icons": [],
				"description": ""
			},
			{
				"order": 0,
				"name": "Time planning",
				"startDate": "2011-10-16T23:00:00.000Z",
				"id": "gantt1",
				"endDate": "2011-10-21T13:00:00.000Z",
				"estimatedHours": 6,
				"percentageDone": 60,
				"parentElement": "planning",
				"icons": [
					{
						"type": "deadline",
						"date": "2011-10-24T00:00:00.000Z",
						"description": "Initial gantt"
					}
				],
				"description": "",
				"type": "",
				"hoursExpected": null,
				"resources": [],
				"predecessors": []
			},
			{
				"order": 0,
				"name": "Initial mockups",
				"startDate": "2011-10-19T23:00:00.000Z",
				"id": "design1",
				"endDate": "2011-10-21T13:00:00.000Z",
				"estimatedHours": 6,
				"percentageDone": 10,
				"parentElement": "planning",
				"icons": [],
				"description": "",
				"type": "",
				"hoursExpected": null,
				"resources": [],
				"predecessors": []
			},
			{
				"order": 0,
				"name": "Prestudy",
				"startDate": "2011-10-20T23:00:00.000Z",
				"id": "prestudy",
				"endDate": "2011-11-19T00:00:00.000Z",
				"type": "analysis",
				"percentageDone": 2,
				"parentElement": "planning",
				"icons": [
					{
						"type": "deadline",
						"date": "2011-11-04T23:00:00.000Z",
						"description": "Feature study 1"
					},
					{
						"type": "deadline",
						"date": "2011-11-11T23:00:00.000Z",
						"description": "Feature study 2"
					}
				],
				"description": "",
				"hoursExpected": 30,
				"resources": [],
				"predecessors": [],
				"estimatedHours": 30
			},
			{
				"order": 3,
				"name": "Software development",
				"startDate": "2011-10-22T23:00:00.000Z",
				"id": "dev",
				"endDate": "2012-03-01T00:00:00.000Z",
				"predecessors": [
					"brief"
				],
				"type": "programming",
				"percentageDone": 1,
				"hoursExpected": null,
				"resources": [],
				"icons": [
					{
						"type": "deadline",
						"date": "2012-02-13T23:00:00.000Z",
						"description": "Deploy large-scale"
					},
					{
						"type": "deadline",
						"date": "2011-12-16T23:00:00.000Z",
						"description": "Deploy small-scale"
					}
				],
				"description": "",
				"parentElement": ""
			},
			{
				"order": 0,
				"id": "software-pre",
				"name": "Prestudy software",
				"startDate": "2011-10-22T23:00:00.000Z",
				"endDate": "2011-10-27T23:00:00.000Z",
				"description": "",
				"type": "programming",
				"percentageDone": 20,
				"hoursExpected": 15,
				"resources": [],
				"predecessors": [],
				"icons": [],
				"parentElement": "dev"
			},
			{
				"order": 1,
				"name": "Software phase 1",
				"startDate": "2011-11-01T00:00:00.000Z",
				"id": "software1",
				"endDate": "2011-12-17T00:00:00.000Z",
				"parentElement": "dev",
				"type": "programming",
				"percentageDone": null,
				"hoursExpected": null,
				"resources": [],
				"predecessors": [],
				"icons": [],
				"description": "Partial implementation, ready for a release before christmas for a small scale study.",
				"estimatedHours": null
			},
			{
				"order": 2,
				"name": "Software phase 2",
				"startDate": "2012-01-12T00:00:00.000Z",
				"id": "software2",
				"endDate": "2012-02-14T00:00:00.000Z",
				"parentElement": "dev",
				"type": "programming",
				"percentageDone": null,
				"hoursExpected": null,
				"resources": [],
				"predecessors": [],
				"icons": [],
				"description": "Full implementation of software. Will be deployed on a large scale for a more in-depth study.",
				"estimatedHours": null
			},
			{
				"order": 4,
				"name": "Study",
				"startDate": "2011-12-18T00:00:00.000Z",
				"id": "study",
				"endDate": "2012-04-11T23:00:00.000Z",
				"type": "analysis",
				"percentageDone": null,
				"hoursExpected": null,
				"resources": [],
				"predecessors": [],
				"icons": [],
				"description": "",
				"estimatedHours": null
			},
			{
				"order": 0,
				"name": "First study",
				"startDate": "2011-12-18T00:00:00.000Z",
				"id": "study1",
				"endDate": "2012-01-11T00:00:00.000Z",
				"type": "analysis",
				"predecessors": [
					"software1"
				],
				"parentElement": "study",
				"icons": [],
				"description": "",
				"percentageDone": null,
				"estimatedHours": null,
				"resources": []
			},
			{
				"order": 0,
				"name": "Second study",
				"startDate": "2012-02-15T00:00:00.000Z",
				"id": "study2",
				"endDate": "2012-04-11T23:00:00.000Z",
				"type": "analysis",
				"predecessors": [
					"software2"
				],
				"parentElement": "study",
				"icons": [
					{
						"type": "deadline",
						"date": "2012-02-13T23:00:00.000Z",
						"description": "Something deadline"
					}
				],
				"description": "",
				"percentageDone": null,
				"hoursExpected": null,
				"resources": []
			},
			{
				"order": 9,
				"name": "Progress Report",
				"startDate": "2011-12-07T00:00:00.000Z",
				"id": "progreport",
				"endDate": "2011-12-14T16:00:00.000Z",
				"type": "documentation",
				"percentageDone": null,
				"hoursExpected": null,
				"resources": [],
				"predecessors": [],
				"icons": [],
				"description": "",
				"estimatedHours": null
			},
			{
				"order": 10,
				"name": "Final Project Report",
				"startDate": "2012-04-01T23:00:00.000Z",
				"id": "finalreport",
				"endDate": "2012-05-01T23:00:00.000Z",
				"type": "documentation",
				"percentageDone": null,
				"hoursExpected": null,
				"resources": [],
				"predecessors": [],
				"icons": [],
				"description": "",
				"estimatedHours": null
			}
		]
	});

	jQuery("#container").append(gantt.render().el);

});