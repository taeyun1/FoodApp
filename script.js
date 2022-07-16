let container = document.getElementById("map"); //지도를 담을 영역의 DOM 레퍼런스
let options = {
  //지도를 생성할 때 필요한 기본 옵션
  center: new kakao.maps.LatLng(37.408411, 127.204815), //지도의 중심좌표.
  level: 10, //지도의 레벨(확대, 축소 정도)
};

let map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴

// ========== 확대 축소 컨트롤러 ==========
// 일반 지도와 스카이뷰로 지도 타입을 전환할 수 있는 지도타입 컨트롤을 생성합니다
var mapTypeControl = new kakao.maps.MapTypeControl();

// 지도에 컨트롤을 추가해야 지도위에 표시됩니다
// kakao.maps.ControlPosition은 컨트롤이 표시될 위치를 정의하는데 TOPRIGHT는 오른쪽 위를 의미합니다
map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
let zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
// ========================================

/*
2. 더미데이터 준비하기 (제목, 주소, url, 카테고리)
*/
const dataSet = [
  {
    title: "희락돈까스",
    address: "서울 영등포구 양산로 210",
    url: "https://www.youtube.com/watch?v=1YOJbOUR4vw&t=88s",
    category: "양식",
  },
  {
    title: "즉석우동짜장",
    address: "서울 영등포구 대방천로 260",
    url: "https://www.youtube.com/watch?v=1YOJbOUR4vw&t=88s",
    category: "한식",
  },
  {
    title: "아카사카",
    address: "서울 서초구 서초대로74길 23",
    url: "https://www.youtube.com/watch?v=1YOJbOUR4vw&t=88s",
    category: "일식",
  },
];

/*
3. 여러개 마커 찍기
  * 주소 - 좌표 변환
https://apis.map.kakao.com/web/sample/multipleMarkerImage/ (여러개 마커)
https://apis.map.kakao.com/web/sample/addr2coord/ (주소로 장소 표시하기)
*/

// 주소 - 좌표 변환 함수 (비동기 문제 발생 해결)

// 주소-좌표 변환 객체를 생성합니다
var geocoder = new kakao.maps.services.Geocoder();

// 주소-좌표 변환 함수
const getCoordsByAddress = (address) => {
  return new Promise((resolve, reject) => {
    // 주소로 좌표를 검색합니다
    geocoder.addressSearch(address, function (result, status) {
      // 정상적으로 검색이 완료됐으면
      if (status === kakao.maps.services.Status.OK) {
        var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        resolve(coords); // 성공시 실행
        return;
      }
      // 좌표를 가져오는데 실패하면 실행
      reject(new Error("getCoordsByAddress Error: 잘못된 주소"));
    });
  });
};

/* 
4. 마커에 인포윈도우 붙이기
  * 마커에 클릭 이벤트로 인포윈도우 https://apis.map.kakao.com/web/sample/multipleMarkerEvent/
  * url에서 섬네일 따기
  * 클릭한 마커로 지도 센터 이동 https://apis.map.kakao.com/web/sample/moveMap/
*/

const getContent = (data) => {
  // 유튜브 썸네일 id 가져오기
  let replaceUrl = data.url;
  let finUrl = "";
  replaceUrl = replaceUrl.replace("https://youtu.be/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/embed/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/watch?v=", "");
  finUrl = replaceUrl.split("&")[0];

  // 인포윈도우 가공하기
  return `
	<div class="infowindow">
			<div class="infowindow-img-container">
				<img src="https://img.youtube.com/vi/${finUrl}/mqdefault.jpg" alt="" class="infowindow-img">
			</div>
			<div class="infowindow-body">
				<h5 class="infowindow-title">${data.title}</h5>
				<p class="infowindow-addres">${data.address}</p>
				<a href="${data.url}" class="infowindow-link" target="_blank">영상보기</a>
			</div>
		</div>
	`;
};

const setMap = async (dataSet) => {
  // 마커를 생성합니다
  for (let i = 0; i < dataSet.length; i++) {
    let coords = await getCoordsByAddress(dataSet[i].address);
    let marker = new kakao.maps.Marker({
      map: map, // 마커를 표시할 지도
      position: coords, // 마커를 표시할 위치
    });

    markerArray.push(marker);

    // 마커에 표시할 인포윈도우를 생성합니다
    var infowindow = new kakao.maps.InfoWindow({
      content: getContent(dataSet[i]), // 인포윈도우에 표시할 내용
    });

    // 마커에 표시할 인포윈도우가 생성될때마다 배열에 추가
    infoWindowArray.push(infowindow);

    // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
    // 이벤트 리스너로는 클로저를 만들어 등록합니다
    // for문에서 클로저를 만들어 주지 않으면 마지막 마커에만 이벤트가 등록됩니다
    kakao.maps.event.addListener(
      marker, // 마커에
      // "mouseover" // 마우스 hover시 이미지나옴
      "click", // 마커 클릭시 나옴
      makeOverListener(map, marker, infowindow, coords)
    );

    // "mouseout" -> 마커에 마우스 땠을때 사라짐
    kakao.maps.event.addListener(map, "click", makeOutListener(infowindow));
  }
};

// 인포윈도우를 표시하는 클로저를 만드는 함수입니다
/* 
  커스텀
  1. 클릭시 다른 인포윈도우 닫기
  2. 클릭한 곳으로 지도 중심 이동하기
*/

function makeOverListener(map, marker, infowindow, coords) {
  return function () {
    // 1. 클릭시 다른 인포윈도우 닫기
    closeInfoWindow();
    infowindow.open(map, marker);

    // 2. 클릭한 곳으로 지도 중심 이동하기 -> 참고 : https://apis.map.kakao.com/web/sample/moveMap/
    // map.panTo() 지도 중심을 부드럽게 이동시킵니다. (만약 이동할 거리가 지도 화면보다 크면 부드러운 효과 없이 이동합니다)
    map.panTo(coords);
  };
}

let infoWindowArray = [];

const closeInfoWindow = () => {
  for (let infowindow of infoWindowArray) {
    infowindow.close();
  }
};

// 인포윈도우를 닫는 클로저를 만드는 함수입니다
function makeOutListener(infowindow) {
  return function () {
    infowindow.close();
  };
}

/*
5. 카테고리 분류
*/

const categoryMap = {
  korea: "한식",
  china: "중식",
  japan: "일식",
  america: "양식",
  wheat: "분식",
  meat: "구이",
  sushi: "회/초밥",
  etc: "기타",
};

const categoryList = document.querySelector(".category-list");
categoryList.addEventListener("click", categoryHandler);

// 카테고리 버튼 클릭시 실행
function categoryHandler(e) {
  const categoryId = e.target.id; // korea, china, japan ...
  const category = categoryMap[categoryId]; // 클릭시 id가 korea면 "한식" 할당

  // 데이터 분류
  let categorizedDataSet = [];
  for (let data of dataSet) {
    // dataSet의 category가 우리가 클릭한(category)랑 일치한다면
    if (data.category === category) {
      categorizedDataSet.push(data); // 배열에 추가
    }
  }
  console.log(categorizedDataSet);

  // 기존 마커 삭제
  closeMarKer();

  // 기존 인포윈도우 닫기
  closeInfoWindow();

  setMap(categorizedDataSet);
}

let markerArray = [];
const closeMarKer = () => {
  for (marker of markerArray) {
    marker.setMap(null);
  }
};

setMap(dataSet);
