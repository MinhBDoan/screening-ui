import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

// Entities
import { Question } from '../../entities/Question';
import { Bucket } from '../../entities/Bucket';
import { QuestionScore } from '../../entities/QuestionScore';

// Services
import { QuestionsService } from '../../services/questions/questions.service';
import { QuestionScoreService } from '../../services/question-score/question-score.service';
import { SkillTypeBucketService } from '../../services/skillTypeBucketLookup/skill-type-bucket.service';

// Modal for answering the question
import { AnswerComponent } from '../answer/answer.component';

// ngbootstrap modal
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ScreeningService } from '../../services/screening/screening.service';
import { SimpleTraineeService } from '../../services/simpleTrainee/simple-trainee.service';

@Component({
  selector: 'app-questions-table',
  templateUrl: './questions-table.component.html',
  styleUrls: ['./questions-table.component.css']
})

/*
After the candidate has given their introduction,
the screener will proceed to the question-and-answer part of the interview.
A list of questions will be fetched from the server / database,
based on the skills that the screener input on the candidate introduction page.
Screener will be able to see a set of category tabs,
each of which has a set of questions in a table.

Screener has the ability to navigate between tabs ad nauseam,
asking whichever questions they desire. When a screener asks a question,
it will invoke an instance of the question component.

Possible change for the future there are no programmatic constraints
on how many questions a screener can ask, nor are there any constraints
on what the proportion of questions must be (x% Java, y% HTML, z% SQL, etc).
Future iterations may change this.
*/

export class QuestionsTableComponent implements OnInit, OnDestroy {
  // Used to display the categories
  questionBuckets: Bucket[];

  // holds the current category. Used to control
  // which questions are displayed in the questions table.
  currentCategory: Bucket;

  // value entered enables finish button
  generalComment: string;

  // Array of questions answered during the interview
  questionScores: QuestionScore[] = [];

  // The candidate's name
  candidateName: string;

  // used on ngOnDestroy. Will unsubscribe from all observables
  // to prevent memory leaks
  subscriptions: Subscription[] = [];
  constructor(
    private questionService: QuestionsService,
    private questionScoreService: QuestionScoreService,
    private modalService: NgbModal,
    private screeningService: ScreeningService,
    private simpleTraineeService: SimpleTraineeService,
    private skillTypeBucketService: SkillTypeBucketService,
  ) {}

  ngOnInit() {
    // use skillTypeBucketLookup that provides array of buckets and array of weights
    console.log("Selected Candidate: " + JSON.stringify(this.simpleTraineeService.getSelectedCandidate()));
    const skillTypeID = this.simpleTraineeService.getSelectedCandidate().skillTypeID;
    console.log("skill type id" + skillTypeID);
    this.subscriptions.push(

      this.skillTypeBucketService.
      getWeightsBySkillType(skillTypeID).subscribe(bucketsWithWeights => {
        console.log("buckets with weights " + JSON.stringify(bucketsWithWeights));
      const myBuckets: Bucket[] = [];
      for ( const e of bucketsWithWeights) {
        myBuckets.push(
          {
            bucketId: e.bucket.bucketId,
            bucketDescription: e.bucket.bucketDescription,
            isActive: e.bucket.isActive
          }
        );
      }

       this.skillTypeBucketService.bucketsByWeight = bucketsWithWeights;
      //{
      //   // skillTypeBucketLookupID: bucketsWithWeights.skillTypeBucketLookupID,
      //   skillType: JSON.parse(JSON.stringify(bucketsWithWeights.skillType)),
      //   buckets: myBuckets,
      //   weights: JSON.parse(JSON.stringify(bucketsWithWeights.weight)),
      // };

      this.subscriptions.push(this.questionService.getQuestions(skillTypeID).subscribe(allQuestions => {
        this.questionBuckets = bucketsWithWeights
      // this.subscriptions.push(this.questionService.getQuestions(skillTypeID).subscribe(allQuestions => {
      //   this.questionBuckets = this.questionService.saveQuestions(allQuestions, this.skillTypeBucketService.bucketsByWeight);
      //   this.skillTypeBucketService.bucketsByWeight.buckets = JSON.parse(JSON.stringify(this.questionBuckets));

        // if (this.questionBuckets.length > 0) {
        //   this.currentCategory = this.questionBuckets[0];
        // }
      }));
    }));

    this.candidateName = this.simpleTraineeService.getSelectedCandidate().firstname + ' ' +
                          this.simpleTraineeService.getSelectedCandidate().lastname;

    // update the answeredQuestions variable in our service to track the
    // questions that have been given a score by the screener.
    this.subscriptions.push(this.questionScoreService.currentQuestionScores.subscribe(
      questionScores => (this.questionScores = questionScores)
    ));
  }

  /**
   * TO DO BITCHES!
   * WE DONT DO ANYTHING HERE NOW
   */
  // Unsubscribe to prevent memory leaks when component is destroyed
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe);
    // if (this.questionBuckets !== undefined) {
    //   for (const bucket of this.questionBuckets) {
    //   }
    // }
  }

  // sets the current category, allowing for dynamic change
  // of the questions being displayed.
  setBucket(bucketID: number) {
    // iterate through each bucket
    // if the current bucket's id matches the bucket id
    // of the category selected by the user
    for (const bucket of this.questionBuckets) {
      if (bucket.bucketId === bucketID) {
        // set the current category to the current bucket.
        this.currentCategory = bucket;
      }
    }
  }

  open(question: Question) {
    const modalRef = this.modalService.open(AnswerComponent);
    modalRef.componentInstance.question = question;
  }

  // used to display the green question mark on answered questions
  isAnsweredQuestion(question: Question): boolean {
    // iterate through the array of question scores
    for (const q of this.questionScores) {
      // if the current question score's question ID matches the question parameter's id
      if (q.questionId === question.questionId) {
        return true;
      }
    }
  }

  // Method that controls whether the user is allowed to click the submit button
  submitAllowed(): boolean {
    let allowed = true;

    if (this.generalComment) {
      if (this.generalComment.length < 1) {
        allowed = false;
      }
    } else {
      allowed = false;
    }
    return !allowed;
  }

  // Method that calls the servce method, submitting the screener's general comments.
  saveFeedback() {
    // tslint:disable-next-line:radix
    this.screeningService.updateScreening(parseInt( localStorage.getItem('screeningID') ));
  }
}
