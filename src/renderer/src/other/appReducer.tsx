import { getLocalStorage } from '@renderer/utils/localStorage';
import { type ReactNode } from 'react';

export interface AppReducer {
  userData: UserData;
  isDarkMode: boolean;
  localStorage: LocalStorage;
  currentSongData: AudioPlayerData;
  upNextSongData?: AudioPlayerData;
  promptMenuNavigationData: PromptMenuNavigationHistoryData;
  promptMenuData: {
    prompt?: ReactNode;
    isVisible: boolean;
    className?: string;
    currentActiveIndex: number;
    noOfPrompts: number;
  };
  notificationPanelData: NotificationPanelData;
  contextMenuData: ContextMenuData;
  navigationHistory: NavigationHistoryData;
  currentlyActivePage: NavigationHistory;
  player: Player;
  bodyBackgroundImage?: string;
  multipleSelectionsData: MultipleSelectionData;
  appUpdatesState: AppUpdatesState;
  isOnBatteryPower: boolean;
  playerType: PlayerTypes;
}

export type AppReducerStateActions =
  | { type: 'USER_DATA_CHANGE'; data: UserData }
  | { type: 'START_PLAY_STATE_CHANGE'; data: unknown }
  | {
      type: 'APP_THEME_CHANGE';
      data: AppThemeData;
    }
  | { type: 'CURRENT_SONG_DATA_CHANGE'; data: AudioPlayerData }
  | { type: 'UP_NEXT_SONG_DATA_CHANGE'; data?: AudioPlayerData }
  | { type: 'CURRENT_SONG_PLAYBACK_STATE'; data: boolean }
  | { type: 'PROMPT_MENU_DATA_CHANGE'; data: PromptMenuNavigationHistoryData }
  | { type: 'ADD_NEW_NOTIFICATIONS'; data: AppNotification[] }
  | { type: 'UPDATE_NOTIFICATIONS'; data: AppNotification[] }
  | { type: 'CONTEXT_MENU_DATA_CHANGE'; data: ContextMenuData }
  | { type: 'CONTEXT_MENU_VISIBILITY_CHANGE'; data: boolean }
  | { type: 'CURRENT_ACTIVE_PAGE_DATA_UPDATE'; data: PageData }
  | { type: 'UPDATE_NAVIGATION_HISTORY'; data: NavigationHistoryData }
  | { type: 'UPDATE_PLAYER_TYPE'; data: PlayerTypes }
  | {
      type: 'UPDATE_VOLUME';
      data: PlayerVolume;
    }
  | { type: 'UPDATE_MUTED_STATE'; data?: boolean }
  | { type: 'UPDATE_SONG_POSITION'; data: number }
  | { type: 'UPDATE_IS_REPEATING_STATE'; data: RepeatTypes }
  | { type: 'TOGGLE_IS_FAVORITE_STATE'; data?: boolean }
  | { type: 'TOGGLE_SHUFFLE_STATE'; data?: boolean }
  | { type: 'UPDATE_VOLUME_VALUE'; data: number }
  | { type: 'UPDATE_QUEUE'; data: Queue }
  | { type: 'UPDATE_PLAYBACK_RATE'; data: number } // 👈 新增此行
  | { type: 'UPDATE_LOCAL_STORAGE_PREFERENCES'; data: LocalStorage['preferences'] }
  | { type: 'UPDATE_QUEUE_CURRENT_SONG_INDEX'; data: number }
  | { type: 'UPDATE_PLAYLIST_PROGRESS'; data: { playlistId: string; songId: string; position: number };}
  | { type: 'SAVE_CURRENT_PLAYBACK_PROGRESS'; data: number }
  | { type: 'TOGGLE_REDUCED_MOTION'; data?: boolean }
  | { type: 'TOGGLE_SONG_INDEXING'; data?: boolean }
  | { type: 'PLAYER_WAITING_STATUS'; data: boolean }
  | { type: 'UPDATE_BODY_BACKGROUND_IMAGE'; data?: string }
  | { type: 'UPDATE_MULTIPLE_SELECTIONS_DATA'; data: MultipleSelectionData }
  | { type: 'CHANGE_APP_UPDATES_DATA'; data: AppUpdatesState }
  | { type: 'UPDATE_LOCAL_STORAGE'; data: LocalStorage }
  | { type: 'UPDATE_BATTERY_POWER_STATE'; data: boolean }
  | { type: 'TOGGLE_SHOW_SONG_REMAINING_DURATION'; data?: boolean }
  | { type: 'UPDATE_LOCAL_STORAGE_PREFERENCES'; data: LocalStorage['preferences'] }
  | {
      type: 'UPDATE_LOCAL_STORAGE_PREFERENCE_ITEM';
      data: { item: string; value: LocalStorage['preferences'] };
    };

export const reducer = (state: AppReducer, action: AppReducerStateActions): AppReducer => {
  switch (action.type) {
    case 'APP_THEME_CHANGE': {
      const theme = action.data ?? USER_DATA_TEMPLATE.theme;
      return {
        ...state,
        isDarkMode: theme.isDarkMode,
        userData: { ...state.userData, theme }
      };
    }
    case 'USER_DATA_CHANGE':
      return {
        ...state,
        userData: action.data ?? state.userData
      };
    case 'TOGGLE_REDUCED_MOTION':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          preferences: {
            ...state.localStorage.preferences,
            isReducedMotion: action.data ?? state.localStorage.preferences.isReducedMotion
          }
        }
      };

    case 'UPDATE_PLAYBACK_RATE': { // 👈 新增处理
      const playbackRate = action.data ?? state.player.playbackRate;
      return {
        ...state,
        player: {
          ...state.player,
          playbackRate // 更新瞬时播放器状态
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            playbackRate // 更新持久化存储状态 (用于下次启动)
          }
        }
      };
    }

    case 'UPDATE_PLAYLIST_PROGRESS': {
      const { playlistId, songId, position } = action.data;

      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          playlistPlaybackProgress: {
            ...state.localStorage.playlistPlaybackProgress,
            [playlistId]: {
              songId,
              stoppedPosition: position
            }
          }
        }
      };
    }

    case 'SAVE_CURRENT_PLAYBACK_PROGRESS': {
      const songPosition = action.data; // 播放器当前的 currentTime
      const { queueId } = state.localStorage.queue;
      const currentSongId = state.currentSongData.songId;

      // 仅在当前播放队列是 'playlist' 类型且有 ID 时才保存
      if (
          state.localStorage.queue.queueType === 'playlist' &&
          queueId &&
          currentSongId
      ) {
        // 成功日志（如果在控制台中看到此日志，则保存成功）
        console.log(`[APP_REDUCER_SUCCESS] 进度已保存。Type: ID: ${queueId}, Song: ${currentSongId}, Pos: ${songPosition}`);
        return {
          ...state,
          localStorage: {
            ...state.localStorage,
            playlistPlaybackProgress: {
              ...state.localStorage.playlistPlaybackProgress,
              [queueId]: {
                songId: currentSongId,
                stoppedPosition: songPosition
              }
            }
          }
        };
      }
      // 失败日志（如果在控制台中看到此日志，则表示条件不满足）
      console.error(`[APP_REDUCER_SAVE_FAIL] 无法保存。Type: QueueId: ${queueId}, SongId: ${currentSongId}`);
      return state; // 如果不是播放列表或信息不全，则不作修改
    }

    case 'TOGGLE_SONG_INDEXING':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          preferences: {
            ...state.localStorage.preferences,
            isSongIndexingEnabled:
              action.data ?? state.localStorage.preferences.isSongIndexingEnabled
          }
        }
      };
    case 'TOGGLE_SHOW_SONG_REMAINING_DURATION':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          preferences: {
            ...state.localStorage.preferences,
            showSongRemainingTime:
              action.data ?? state.localStorage.preferences.showSongRemainingTime
          }
        }
      };
    case 'PROMPT_MENU_DATA_CHANGE': {
      const promptMenuNavigationData = action.data ? action.data : state.promptMenuNavigationData;

      const promptMenuData = {
        isVisible: promptMenuNavigationData?.isVisible,
        prompt: promptMenuNavigationData.prompts?.at(promptMenuNavigationData.currentActiveIndex)
          ?.prompt,
        className: promptMenuNavigationData.prompts?.at(promptMenuNavigationData.currentActiveIndex)
          ?.className,
        noOfPrompts: promptMenuNavigationData.prompts.length,
        currentActiveIndex: promptMenuNavigationData.currentActiveIndex
      };

      return {
        ...state,
        promptMenuNavigationData,
        promptMenuData
      };
    }
    case 'ADD_NEW_NOTIFICATIONS':
      return {
        ...state,
        notificationPanelData: {
          ...state.notificationPanelData,
          notifications: action.data || state.notificationPanelData.notifications
        }
      };
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notificationPanelData: {
          ...state.notificationPanelData,
          notifications: action.data || state.notificationPanelData.notifications
        }
      };
    case 'CONTEXT_MENU_DATA_CHANGE':
      return {
        ...state,
        contextMenuData: action.data || state.contextMenuData
      };
    case 'CONTEXT_MENU_VISIBILITY_CHANGE':
      return {
        ...state,
        contextMenuData: {
          ...state.contextMenuData,
          isVisible: action.data ?? state.contextMenuData.isVisible
        }
      };
    case 'CURRENT_ACTIVE_PAGE_DATA_UPDATE':
      state.navigationHistory.history[state.navigationHistory.pageHistoryIndex].data = action.data;
      return {
        ...state,
        navigationHistory: state.navigationHistory,
        currentlyActivePage:
          state.navigationHistory.history[state.navigationHistory.pageHistoryIndex]
      };
    case 'UPDATE_NAVIGATION_HISTORY': {
      const navigationHistory = { ...action.data };
      return {
        ...state,
        bodyBackgroundImage: undefined,
        navigationHistory,
        currentlyActivePage: navigationHistory.history[navigationHistory.pageHistoryIndex]
      };
    }
    case 'CURRENT_SONG_DATA_CHANGE':
      return {
        ...state,
        currentSongData:
          typeof action.data === 'object'
            ? (action.data as AudioPlayerData)
            : state.currentSongData,
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            currentSong: {
              ...state.localStorage.playback.currentSong,
              songId: action.data.songId ?? state.currentSongData.songId,
              stoppedPosition: 0
            }
          }
        }
      };
    case 'UP_NEXT_SONG_DATA_CHANGE':
      return {
        ...state,
        currentSongData: action.data ?? state.currentSongData
      };
    case 'CURRENT_SONG_PLAYBACK_STATE': {
      return {
        ...state,
        player: {
          ...state.player,
          isCurrentSongPlaying: action.data ?? !state.player.isCurrentSongPlaying
          // isPlayerStalled: action.data ? false : state.player.isPlayerStalled
        }
      };
    }
    case 'UPDATE_PLAYER_TYPE': {
      const type = action.data ?? state.playerType;

      if (type !== 'full') window.api.windowControls.changePlayerType(type);

      return {
        ...state,
        bodyBackgroundImage: undefined,
        playerType: type
      };
    }
    case 'UPDATE_SONG_POSITION':
      return {
        ...state,
        player: {
          ...state.player,
          songPosition: action.data ?? state.player.songPosition
        }
      };
    case 'UPDATE_IS_REPEATING_STATE': {
      const isRepeating = action.data ?? state.player.isRepeating;
      return {
        ...state,
        player: {
          ...state.player,
          isRepeating
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            isRepeating
          }
        }
      };
    }
    case 'TOGGLE_IS_FAVORITE_STATE':
      return {
        ...state,
        currentSongData: {
          ...state.currentSongData,
          isAFavorite: action.data ?? !state.currentSongData.isAFavorite
        }
      };
    case 'TOGGLE_SHUFFLE_STATE': {
      const isShuffling = action.data ?? !state.player.isShuffling;
      return {
        ...state,
        player: {
          ...state.player,
          isShuffling
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            isShuffling
          }
        }
      };
    }
    case 'UPDATE_VOLUME': {
      const volume = action.data ?? state.player.volume;
      return {
        ...state,
        player: {
          ...state.player,
          volume
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            volume
          }
        }
      };
    }
    case 'UPDATE_VOLUME_VALUE': {
      const volume = action.data ?? state.player.volume.value;
      return {
        ...state,
        player: {
          ...state.player,
          volume: {
            value: volume,
            isMuted: volume === 0
          }
        }
      };
    }
    case 'UPDATE_MUTED_STATE': {
      const isMuted = action.data ?? state.player.volume.isMuted;
      return {
        ...state,
        player: {
          ...state.player,
          volume: {
            ...state.player.volume,
            isMuted
          }
        },
        localStorage: {
          ...state.localStorage,
          playback: {
            ...state.localStorage.playback,
            volume: {
              ...state.localStorage.playback.volume,
              isMuted
            }
          }
        }
      };
    }
    case 'UPDATE_QUEUE':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          queue: action.data ?? state.localStorage.queue
        }
      };
    case 'UPDATE_BODY_BACKGROUND_IMAGE':
      return {
        ...state,
        bodyBackgroundImage: action.data ?? state.bodyBackgroundImage
      };
    case 'UPDATE_MULTIPLE_SELECTIONS_DATA':
      return {
        ...state,
        multipleSelectionsData: action.data ?? state.multipleSelectionsData
      };
    case 'CHANGE_APP_UPDATES_DATA':
      return {
        ...state,
        appUpdatesState: action.data ?? state.appUpdatesState
      };
    case 'PLAYER_WAITING_STATUS':
      return {
        ...state,
        player: {
          ...state.player,
          isPlayerStalled: action.data ?? state.player.isPlayerStalled
        }
      };
    // ####### LOCAL STORAGE ENTRIES #######
    case 'UPDATE_LOCAL_STORAGE':
      return {
        ...state,
        localStorage: typeof action.data === 'object' ? action.data : state.localStorage
      };
    case 'UPDATE_LOCAL_STORAGE_PREFERENCES':
      return {
        ...state,
        localStorage: {
          ...state.localStorage,
          preferences:
            typeof action.data === 'object' ? action.data : state.localStorage.preferences
        }
      };
    // #####################################
    case 'UPDATE_BATTERY_POWER_STATE':
      return {
        ...state,
        isOnBatteryPower: action.data ?? state.isOnBatteryPower
      };
    default:
      return state;
  }
};

export const LOCAL_STORAGE_DEFAULT_TEMPLATE: LocalStorage = {
  preferences: {
    seekbarScrollInterval: 5,
    isSongIndexingEnabled: false,
    disableBackgroundArtworks: true,
    disableDefaultArtworks: false,
    doNotShowBlacklistSongConfirm: false,
    doNotVerifyWhenOpeningLinks: false,
    isReducedMotion: false,
    showArtistArtworkNearSongControls: false,
    showSongRemainingTime: false,
    noUpdateNotificationForNewUpdate: '',
    defaultPageOnStartUp: 'Home',
    enableArtworkFromSongCovers: false,
    shuffleArtworkFromSongCovers: false,
    removeAnimationsOnBatteryPower: false,
    isPredictiveSearchEnabled: true,
    lyricsAutomaticallySaveState: 'NONE',
    showTrackNumberAsSongIndex: true,
    allowToPreventScreenSleeping: true,
    enableImageBasedDynamicThemes: false,
    doNotShowHelpPageOnLyricsEditorStartUp: false,
    autoTranslateLyrics: false,
    autoConvertLyrics: false
  },
  playback: {
    currentSong: {
      songId: '',
      stoppedPosition: 0
    },
    isRepeating: 'false',
    isShuffling: false,
    volume: {
      isMuted: false,
      value: 50
    },
    playbackRate: 1.0
  },
  // 👈 新增：存储每个播放列表的进度
  playlistPlaybackProgress: {},
  queue: { currentSongIndex: null, queue: [], queueType: 'songs' },
  ignoredSeparateArtists: [],
  ignoredSongsWithFeatArtists: [],
  ignoredDuplicates: {
    albums: [],
    artists: [],
    genres: []
  },
  sortingStates: {
    albumsPage: 'aToZ',
    artistsPage: 'aToZ',
    genresPage: 'aToZ',
    playlistsPage: 'aToZ',
    songsPage: 'aToZ',
    musicFoldersPage: 'aToZ'
  },
  equalizerPreset: {
    thirtyTwoHertzFilter: 0,
    sixtyFourHertzFilter: 0,
    hundredTwentyFiveHertzFilter: 0,
    twoHundredFiftyHertzFilter: 0,
    fiveHundredHertzFilter: 0,
    thousandHertzFilter: 0,
    twoThousandHertzFilter: 0,
    fourThousandHertzFilter: 0,
    eightThousandHertzFilter: 0,
    sixteenThousandHertzFilter: 0
  },
  lyricsEditorSettings: {
    offset: 0,
    editNextAndCurrentStartAndEndTagsAutomatically: true
  }
};

export const USER_DATA_TEMPLATE: UserData = {
  language: 'en',
  theme: { isDarkMode: false, useSystemTheme: true },
  musicFolders: [],
  preferences: {
    autoLaunchApp: false,
    isMiniPlayerAlwaysOnTop: false,
    isMusixmatchLyricsEnabled: false,
    hideWindowOnClose: false,
    openWindowAsHiddenOnSystemStart: false,
    openWindowMaximizedOnStart: false,
    sendSongScrobblingDataToLastFM: false,
    sendSongFavoritesDataToLastFM: false,
    sendNowPlayingSongDataToLastFM: false,
    saveLyricsInLrcFilesForSupportedSongs: false,
    enableDiscordRPC: false,
    saveVerboseLogs: false
  },
  windowPositions: {},
  windowDiamensions: {},
  windowState: 'normal',
  recentSearches: []
};

const localStorage = getLocalStorage();

export const DEFAULT_REDUCER_DATA: AppReducer = {
  isDarkMode: false,
  playerType: 'normal',
  player: {
    isCurrentSongPlaying: false,
    volume: localStorage.playback.volume,
    isRepeating: localStorage.playback.isRepeating,
    isShuffling: localStorage.playback.isShuffling,
    songPosition: 0,
    isPlayerStalled: false,
    playbackRate: localStorage.playback.playbackRate
  },
  userData: USER_DATA_TEMPLATE,
  currentSongData: {} as AudioPlayerData,
  upNextSongData: {} as AudioPlayerData,
  localStorage,
  navigationHistory: {
    pageHistoryIndex: 0,
    history: [
      {
        pageTitle: 'Home',
        data: undefined
      }
    ]
  },
  currentlyActivePage: {
    pageTitle: 'Home',
    data: undefined
  },
  contextMenuData: {
    isVisible: false,
    menuItems: [],
    pageX: 200,
    pageY: 200
  },
  notificationPanelData: {
    notifications: []
    // notificationsMap: new Map()
  },
  promptMenuNavigationData: {
    isVisible: false,
    prompts: [],
    currentActiveIndex: 0
  },
  promptMenuData: {
    isVisible: false,
    prompt: undefined,
    className: undefined,
    currentActiveIndex: 0,
    noOfPrompts: 0
  },
  multipleSelectionsData: { isEnabled: false, multipleSelections: [] },
  appUpdatesState: 'UNKNOWN',
  isOnBatteryPower: false
};

export default reducer;
