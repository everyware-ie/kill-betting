39. DRY 원칙 (Don't Repeat Yourself)
    모든 지식은 단일하고 명확하며 권위 있는 하나의 표현만 가져야 한다

코드 중복뿐 아니라 지식, 로직, 데이터의 중복도 포함
중복은 변경 시 여러 곳을 동시에 수정해야 하므로 버그와 불일치의 원인
Andy Hunt와 Dave Thomas가 The Pragmatic Programmer에서 정립
40. KISS 원칙 (Keep It Simple, Stupid)
    설계와 시스템은 가능한 한 단순해야 한다

복잡성은 이해, 유지보수, 디버깅의 비용을 증가시킴
단순한 해결책이 대부분의 경우 더 효과적이며 결함 가능성도 낮음
미국 해군이 1960년대에 제시한 설계 원칙에서 유래
41. SOLID 원칙 (SOLID Principles)
    소프트웨어 설계를 향상시키는 5가지 핵심 가이드라인

S — 단일 책임 원칙(Single Responsibility): 클래스는 하나의 이유로만 변경
O — 개방-폐쇄 원칙(Open-Closed): 확장에 열려 있고 수정에 닫혀 있어야 함
L — Liskov 치환 원칙: 하위 타입은 상위 타입을 대체할 수 있어야 함
I — 인터페이스 분리 원칙: 클라이언트는 사용하지 않는 인터페이스에 의존하지 않아야 함
D — 의존성 역전 원칙: 상위 모듈이 하위 모듈에 의존하지 않고 추상화에 의존
Robert C. Martin이 정립하고 Michael Feathers가 SOLID라는 약어를 명명
42. 디미터 법칙 (Law of Demeter)
    객체는 직접적인 친구와만 상호작용해야 하며, 낯선 객체와의 직접 소통은 지양해야 한다

a.getB().getC().doSomething() 같은 체인 호출을 피해야 한다는 원칙
결합도를 낮추고 캡슐화를 강화하여 변경 영향 범위를 줄임
"최소 지식의 원칙"이라고도 불림
43. 최소 놀라움의 원칙 (Principle of Least Astonishment)
    소프트웨어와 인터페이스는 사용자와 다른 개발자를 가장 적게 놀라게 하는 방식으로 동작해야 한다

함수, API, UI가 이름과 컨벤션에서 예측 가능한 동작을 해야 함
delete() 함수가 실제로는 아카이브만 한다면 놀라움을 유발 → 설계 결함
직관적이지 않은 동작은 버그와 사용자 실수를 초래
44. YAGNI (You Aren't Gonna Need It)
    필요하기 전까지 기능을 추가하지 말 것

Extreme Programming(XP)의 핵심 원칙으로 1990년대 후반 Ron Jeffries가 제시
"미래에 필요할지 모른다"는 이유로 코드를 작성하면 과잉 설계와 유지보수 부담 발생
리팩토링에 대한 자신감(좋은 테스트 커버리지, CI)이 있어야 YAGNI를 실천 가능
현재 JSON 내보내기만 필요하면 JSON만 구현, XML/YAML 등은 요구될 때 추가
