jQuery(window).ready(function () {
	
	var gantt = JSGanttChart.create({
		resources: {
			programmer: "Peter West",
			supervisor: "mc",
			cosupervisor: "max"
		},
		types: {
			analysis: {
				name: "Analysis",
				color: "#C79810"  // yellow
			},
			critical: {
				name: "Critical",
				color: "#CC0000" // red
			},
			programming: {
				name: "Programming",
				color: "#356AA0" // blue
			},
			documentation: {
				name: "Documentation",
				color: "#FF7400" // orange
			}
		},
		elements: [
			{
				id: "meeting1",
				name: "Supervisor meeting",
				startDate: "1 October 2011 11:00",
				percentageDone: 100,
				resources: [ "programmer", "supervisor", "cosupervisor" ]
			},
			{
				id: "brief",
				name: "Project Brief",
				predecessors: ["meeting1"],
				startDate: "3 October 2011",
				endDate: "14 October 2011 16:00",
				type: "critical",
				slackEndDate: "21 October 2011 16:00",//slackDuration: 4, // or slackEndDate: date
				elements: [
					{
						id: "briefdraft1",
						name: "Draft 1",
						startDate: "3 October 2011",
						endDate: "14 October 2011 16:00",
						type: "analysis",
						percentageDone: 100,
						estimatedHours: 5
					},
					{
						id: "briefdraft2",
						predecessors: ["briefdraft1"],
						name: "Draft 2",
						startDate: "15 October 2011",
						endDate: "17 October 2011",
						percentageDone: 90,
						estimatedHours: 5
					},
				],
				percentageDone: 95,
				estimatedHours: 10
			},
			{
				id: "planning",
				name: "Project Planning",
				predecessors: ["brief"],
				startDate: "17 October 2011",
				endDate: "30 October 2011 14:00",
				percentageDone: 50,
				elements: [
					{
						id: "gantt1",
						name: "Time planning",
						startDate: "17 October 2011",
						endDate: "21 October 2011 14:00",
						estimatedHours: 6,
						percentageDone: 60
					},
					{
						id: "design1",
						name: "Initial mockups",
						startDate: "20 October 2011", 
						endDate: "21 October 2011 14:00",
						estimatedHours: 6,
						percentageDone: 10
					},
					{
						id: "prestudy",
						name: "Prestudy",
						startDate: "18 October 2011",
						endDate: "29 October 2011",
						type: "analysis",
						percentageDone: 2,
					}
				]
			},
			{
				id: "dev",
				name: "Software development",
				startDate: "1 November 2011",
				endDate: "1 March 2012",
				predecessors: ["planning"],
				elements: [
					{
						id: "software1",
						name: "Software development P1",
						startDate: "1 November 2011",
						endDate: "17 December 2011"
					},
					{
						id: "software2",
						name: "Software development P2",
						startDate: "12 January 2012",
						endDate: "14 February 2012"
					}
				]
			},
			{
				id: "study",
				name: "Study",
				startDate: "18 December 2011",
				endDate: "12 April 2012",
				type: "analysis",
				elements: [
					{
						id: "study1",
						name: "First study",
						startDate: "18 December 2011",
						endDate: "11 January 2012",
						type: "analysis",
						predecessors: ["software1"]
					},
					{
						id: "study2",
						name: "Second study",
						startDate: "15 February 2012",
						endDate: "12 April 2012",
						type: "analysis",
						predecessors: ["software2"]
					}
				]
			},
			{
				id: "reviewmeeting1",
				name: "Review meeting",
				startDate: "13 November 2011"
			},
			{
				id: "progreport",
				name: "Progress Report",
				startDate: "7 December 2011",
				endDate: "14 December 2011 16:00",
				type: "documentation"
			},
			{
				id: "finalreport",
				name: "Final Project Report",
				startDate: "2 April 2012",
				endDate: "2 May 2012",
				type: "documentation"
			}
		]
	});

	jQuery("#container").append(gantt.render().el);

});