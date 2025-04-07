import { LinePosition } from "@/components/glowing-progress-lines"

// src/lib/constants.ts
export const SESSION_DURATION_MINUTES = 30

export const linePositions: Record<string, LinePosition[]> = {
	thumb: [
		{
			start: { top: "173px", left: "11px" },
			end: { top: "173px", left: "63px" },
			rotation: 285,
		},
		{
			start: { top: "175px", left: "25px" },
			end: { top: "175px", left: "74px" },
			rotation: 285,
		},
		{
			start: { top: "180px", left: "39px" },
			end: { top: "180px", left: "88px" },
			rotation: 285,
		},
		{
			start: { top: "185px", left: "53px" },
			end: { top: "185px", left: "102px" },
			rotation: 285,
		},
		{
			start: { top: "190px", left: "67px" },
			end: { top: "190px", left: "116px" },
			rotation: 285,
		},
		{
			start: { top: "195px", left: "81px" },
			end: { top: "195px", left: "130px" },
			rotation: 285,
		},
	],
	index: [
		{
			start: { top: "20px", left: "145px" },
			end: { top: "20px", left: "190px" },
		},
		{
			start: { top: "35px", left: "145px" },
			end: { top: "35px", left: "190px" },
		},
		{
			start: { top: "50px", left: "145px" },
			end: { top: "50px", left: "190px" },
		},
		{
			start: { top: "65px", left: "145px" },
			end: { top: "65px", left: "190px" },
		},
		{
			start: { top: "80px", left: "145px" },
			end: { top: "80px", left: "190px" },
		},
		{
			start: { top: "95px", left: "145px" },
			end: { top: "95px", left: "190px" },
		},
	],
	middle: [
		{
			start: { top: "28px", left: "206px" },
			end: { top: "28px", left: "248px" },
		},
		{
			start: { top: "43px", left: "202px" },
			end: { top: "43px", left: "247px" },
		},
		{
			start: { top: "58px", left: "199px" },
			end: { top: "58px", left: "243px" },
		},
		{
			start: { top: "73px", left: "197px" },
			end: { top: "73px", left: "241px" },
		},
		{
			start: { top: "88px", left: "194px" },
			end: { top: "88px", left: "237px" },
		},
		{
			start: { top: "103px", left: "191px" },
			end: { top: "103px", left: "234px" },
		},
	],
	ring: [
		{
			start: { top: "46px", left: "254px" },
			end: { top: "46px", left: "295px" },
		},
		{
			start: { top: "60px", left: "250px" },
			end: { top: "60px", left: "292px" },
		},
		{
			start: { top: "74px", left: "246px" },
			end: { top: "74px", left: "289px" },
		},
		{
			start: { top: "88px", left: "242px" },
			end: { top: "88px", left: "284px" },
		},
		{
			start: { top: "98px", left: "240px" },
			end: { top: "98px", left: "282px" },
		},
		{
			start: { top: "108px", left: "236px" },
			end: { top: "108px", left: "278px" },
		},
	],
	pinky: [
		{
			start: { top: "65px", left: "304px" },
			end: { top: "65px", left: "345px" },
		},
		{
			start: { top: "78px", left: "300px" },
			end: { top: "78px", left: "341px" },
		},
		{
			start: { top: "91px", left: "294px" },
			end: { top: "91px", left: "335px" },
		},
		{
			start: { top: "104px", left: "290px" },
			end: { top: "104px", left: "329px" },
		},
		{
			start: { top: "114px", left: "286px" },
			end: { top: "114px", left: "325px" },
		},
		{
			start: { top: "124px", left: "284px" },
			end: { top: "124px", left: "323px" },
		},
	],
	palm: [
		{
			start: { top: "135px", left: "141px" },
			end: { top: "135px", left: "310px" },
			rotation: 15,
		},
		{
			start: { top: "146px", left: "135px" },
			end: { top: "146px", left: "310px" },
			rotation: 15,
		},
		{
			start: { top: "146px", left: "135px" },
			end: { top: "146px", left: "315px" },
			rotation: 22,
		},
		{
			start: { top: "155px", left: "132px" },
			end: { top: "155px", left: "315px" },
			rotation: 25,
		},
		{
			start: { top: "160px", left: "115px" },
			end: { top: "160px", left: "318px" },
			rotation: 26,
		},
		{
			start: { top: "173px", left: "115px" },
			end: { top: "170px", left: "318px" },
			rotation: 28,
		},
		{
			start: { top: "290px", left: "125px" },
			end: { top: "170px", left: "295px" },
			rotation: 356,
		},
	],
}
