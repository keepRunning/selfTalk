import { Component, ElementRef, ViewChild, Input, OnInit } from '@angular/core';
import { Message } from './message';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { timeout } from 'q';
import { ActivatedRoute, UrlSegment, ParamMap, Router, Event, ActivationEnd } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { IndexedDBHelper } from './app-indexedDB-helper.';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [trigger('highlightMessage', [
    state('highlighted', style({
      backgroundColor: 'lightgoldenrodyellow',
    })),
    state('normal', style({})),
    transition('highlighted => normal', [
      animate('2s')
    ]),
  ])]
})
export class AppComponent implements OnInit {
  title = 'app-selftalk';
  public messages: Message[] = [];
  public person1: string = 'Alice';
  public person2: string = "Bob";
  public inputText;
  public Math = Math;
  public highlightLatestMessage;
  public indexedDBHelper = new IndexedDBHelper();
  @ViewChild('InputText') public inputTextElementref: ElementRef;
  @ViewChild('Conversations') private divConversations: ElementRef;

  private messageCounter: number = 0;
  private customString: string = 'default';

  public constructor(private route: ActivatedRoute, private router: Router) {

    router.events.subscribe((e: Event) => {
      // console.log(e);
      if (e instanceof ActivationEnd) {
        // console.log('ActivationEnd-params', e.snapshot.params);
        if (e.snapshot.params && e.snapshot.params['id']) {
          this.customString = e.snapshot.params['id'];
          console.log('customString', this.customString);
          this.retrieveData();
        }
      }
    });
    this.indexedDBHelper.initializeDB().then(() => {
      this.retrieveData();
    });

  }

  public ngOnInit(): void {
    if (this.inputTextElementref) {
      this.inputTextElementref.nativeElement.focus();
    }

    (window as any).messages = this.messages;
    console.log('********** messages object avilable. check this.messages', this.messages);
  }

  public keydown(k: any) {
    if (k.key == 'Enter' && !k.shiftKey) {
      this.addToConversation();
      return false;
    } else if (k.key == 'Enter' && k.shiftKey) {
      this.inputText += '\n';
      return false;
    }
  }

  public addToConversation() {
    if (this.messages.length === 0 || this.messages[this.messages.length - 1].isComplete) {
      let m = new Message();
      m.alice = this.inputText;
      m.messageId = this.messageCounter++;
      this.messages.push(m);
    } else {
      let m = this.messages[this.messages.length - 1];
      m.bob = this.inputText;
      m.isComplete = true;

      this.indexedDBHelper.saveMessage(this.messages, this.customString);
    }

    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
    this.clearTextBox();
    this.highlightLatestMessage = true;
    setTimeout(() => {
      this.highlightLatestMessage = false;
    }, 100);
  }

  public clearMessages() {
    this.messages = [];
    this.indexedDBHelper.saveMessage(this.messages, this.customString);
  }

  public updateRoute(subRoute: string) {
    this.router.navigate([subRoute], { relativeTo: this.route });
  }

  public retrieveData() {
    this.indexedDBHelper.getData(this.customString).then((res2: any) => {
      console.log('Retrieved data - oninit', res2);
      if (res2 && res2.messageObject) {
        this.messages = res2.messageObject;
        setTimeout(() => {
          this.scrollToBottom();
        }, 200);
      } else {
        this.messages = [];
      }
    });
  }

  private clearTextBox() {
    this.inputTextElementref.nativeElement.value = '';
  }

  private scrollToBottom() {
    try {
      this.divConversations.nativeElement.scrollTop = this.divConversations.nativeElement.scrollHeight;
    } catch (err) { }
  }
}