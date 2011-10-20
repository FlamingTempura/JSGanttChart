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
				slackDuration: 4, // or slackEndDate: date
				elements: [
					{
						predecessors: ["brief"],
						id: "prestudy2",
						name: "Prestudy",
						startDate: "18 October 2011",
						endDate: "29 October 2011",
						type: "analysis",
						percentageDone: 2,
					},
					{
						id: "reviewmeeting2",
						name: "Review meeting",
						startDate: "13 November 2011"
					},
				],
				percentageDone: 59,
				estimatedHours: 10
			},
			{
						predecessors: ["brief"],
				id: "prestudy",
				name: "Prestudy",
				startDate: "18 October 2011",
				endDate: "29 October 2011",
				type: "analysis",
				percentageDone: 2,
			},
			{
				id: "software1",
				name: "Software development P1",
				startDate: "20 October 2011",
				endDate: "14 December 2011"
			},
			{
				id: "study2",
				name: "Second study",
				startDate: "30 October 2011",
				endDate: "1 December 2011",
				type: "analysis"
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