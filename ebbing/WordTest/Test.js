import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { AntDesign } from 'react-native-vector-icons';
import AsyncStorage from '@react-native-community/async-storage';
import { Alert } from '../components/Alert';
import ADDRESS from '../DummyData/Address';

const Address = ADDRESS;
const { height, width } = Dimensions.get('window');

export default class Test extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalVisible: false,
      wordAnswer: '',
      correctCount: 0,
      totalCount: 0,
      activeQuestionIndex: 0,
      answered: false,
      answerCorrect: false,
      testList: [],
    };

    // textInput DOM 엘리먼트를 저장하기 위한 ref를 생성
    this.textInput = React.createRef();
    this.focusTextInput = this.focusTextInput.bind(this);
    this.inputEnter = this.inputEnter.bind(this);
    this.setModalVisible = this.setModalVisible.bind(this);
  }

  componentDidMount() {
    this.props.navigation.addListener('focus', () => {
      this.focusTextInput();
      this.fetchData();
    });
  }

  async fetchData() {
    let userId = await AsyncStorage.getItem('userId');

    try {
      const response = await fetch(`${Address}/test/${userId}`);
      const responseJson = await response.json();

      this.setState({
        testList: responseJson,
        totalCount: responseJson.length,
      });
    } catch (e) {
      console.error(e);
    }
  }

  answer = (correct) => {
    const { activeQuestionIndex, testList } = this.state;
    if (testList[activeQuestionIndex].word_kor === correct) {
      this.setState(
        (state) => {
          const nextState = {};

          nextState.answered = true;
          nextState.correctCount = state.correctCount + 1;
          nextState.answerCorrect = true;
          this.requestCheck({
            word_kor: correct,
            word_eng: testList[activeQuestionIndex].word_eng,
            word_id: testList[activeQuestionIndex].word_id,
            word_theme: testList[activeQuestionIndex].word_theme,
          });
          return nextState;
        },
        () => {
          setTimeout(() => this.nextQuestion(), 750);
        }
      );
    } else {
      this.setModalVisible(true);
    }
  };

  nextQuestion = () => {
    this.clearTextInput();
    this.focusTextInput();

    this.setState((state) => {
      const nextIndex = state.activeQuestionIndex + 1;

      if (nextIndex >= state.totalCount) {
        return this.props.navigation.popToTop();
      }

      return {
        activeQuestionIndex: nextIndex,
        answered: false,
      };
    });
  };

  _handleButtonPress = () => {
    this.setModalVisible(true);
  };

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
    if (!visible) {
      this.nextQuestion();
    }
  };

  focusTextInput() {
    // DOM API를 사용하여 명시적으로 text 타입의 input 엘리먼트를 포커스
    // DOM 노드를 얻기 위해 "current" 프로퍼티에 접근
    this.textInput.current.focus();
  }

  clearTextInput() {
    this.setState({
      wordAnswer: '',
    });
  }

  async requestCheck(data) {
    let userId = await AsyncStorage.getItem('userId');
    let options = {
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
      },
      credentials: 'include',
      body: JSON.stringify({
        selectedWords: [data],
        user_id: userId,
      }),
    };

    try {
      const response = await fetch(`${Address}/test/pass`, options);
      const responseJson = await response.json();
    } catch (e) {
      console.error(e);
    }
  }

  //Enter시 정답체크 함수 실행
  inputEnter = (wordAnswer) => (e) => {
    if (e.nativeEvent.key == 'Enter') {
      this.answer(wordAnswer);
    }
  };

  render() {
    const { navigation } = this.props;
    const {
      testList,
      activeQuestionIndex,
      correctCount,
      totalCount,
      wordAnswer,
      modalVisible,
    } = this.state;
    const question = testList[activeQuestionIndex];

    return (
      <View style={styles.test}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => this.setModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.container, styles.modalBackgroundStyle]}
            onPress={this.setModalVisible.bind(this, false)}
          >
            <View style={styles.innerContainerTransparentStyle}>
              <AntDesign name="close" size={200} color="#fff" />

              <View style={styles.innerContainerTextView}>
                <Text style={styles.innerContainerHeaderText}>정답</Text>
                <Text style={styles.innerContainerText} numberOfLines={2}>
                  {question !== undefined ? question.word_kor : ''}
                </Text>
                <Text style={styles.innerContainerText} numberOfLines={2}>
                  {question !== undefined ? question.word_eng : ''}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.guageBarOut}>
          <Animated.View
            style={[
              styles.guageBarIn,
              { width: (activeQuestionIndex / totalCount) * 100 + '%' },
            ]}
          ></Animated.View>
        </View>

        <View style={styles.right}>
          <Text style={styles.white}>{`정답 : ${correctCount}     남은 문제 : ${
            totalCount - activeQuestionIndex
          }`}</Text>
        </View>

        <View style={styles.examQuestions}>
          <Text>{question !== undefined ? question.word_eng : ''}</Text>
        </View>

        <TextInput
          style={styles.inputAnswer}
          ref={this.textInput}
          onChangeText={(wordAnswer) => this.setState({ wordAnswer })}
          onKeyPress={this.inputEnter(wordAnswer)}
          value={wordAnswer}
        ></TextInput>

        <View style={styles.selectDoView}>
          <TouchableOpacity
            style={styles.selectDoBtn}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.selectDoText}>그만하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectDoBtn}
            onPress={() => {
              this.answer(wordAnswer);
            }}
          >
            <Text style={styles.selectDoText}>정답 확인</Text>
          </TouchableOpacity>
        </View>
        <Alert
          correct={this.state.answerCorrect}
          visible={this.state.answered}
        />
      </View>
    );
  }
}
const selectDoHeight = 70;
const standardWidth = width - width / 2;

const styles = StyleSheet.create({
  test: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#000',
    // paddingTop: 50,
  },
  examQuestions: {
    width: standardWidth,
    height: 180,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
  },
  inputAnswer: {
    width: standardWidth,
    // height: 180,
    height: 80,
    backgroundColor: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  checkBtnView: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: standardWidth,
    marginBottom: 80,
    marginTop: 10,
  },
  checkBtn: {
    backgroundColor: '#fff',
    padding: 10,
  },
  selectDoView: {
    width: width,
    height: selectDoHeight,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  selectDoBtn: {
    borderColor: '#000',
    borderWidth: 0.5,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: width / 2,
    height: selectDoHeight,
  },
  selectDoText: {
    fontSize: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
  },
  modalBackgroundStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  innerContainerTransparentStyle: {
    backgroundColor: '#D76663',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '75%',
    height: '75%',
  },
  innerContainerTextView: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '85%',
    height: '50%',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
  innerContainerHeaderText: {
    fontWeight: '100',
    fontSize: 15,
    color: '#fff',
  },
  innerContainerText: {
    fontWeight: '100',
    fontSize: 30,
    color: '#fff',
  },
  white: {
    color: '#fff',
    fontSize: 15,
  },
  right: {
    marginBottom: 10,
    marginLeft: 650,
  },
  guageBarOut: {
    width: standardWidth,
    height: '5%',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  guageBarIn: {
    height: '100%',
    backgroundColor: 'blue',
    borderRadius: 10,
  },
});
